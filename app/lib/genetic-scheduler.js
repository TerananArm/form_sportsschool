// app/lib/genetic-scheduler.js
// 🧬 Genetic Algorithm Scheduler - AI-based optimization (Free, no tokens!)

const DAYS = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์'];
const LUNCH_PERIOD = 5;
const MAX_PERIOD = 9;
const MORNING_PERIODS = [1, 2, 3, 4];
const AFTERNOON_PERIODS = [6, 7, 8, 9];

/**
 * Genetic Algorithm Configuration
 */
const GA_CONFIG = {
    POPULATION_SIZE: 50,
    GENERATIONS: 100,
    MUTATION_RATE: 0.15,
    CROSSOVER_RATE: 0.8,
    ELITE_COUNT: 5,
    TOURNAMENT_SIZE: 5,
    SEED: null // Set for reproducibility
};

/**
 * Seeded Random Number Generator for reproducibility
 */
class SeededRandom {
    constructor(seed = Date.now()) {
        this.seed = seed;
    }

    next() {
        this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
        return this.seed / 0x7fffffff;
    }

    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    choice(array) {
        return array[this.nextInt(0, array.length - 1)];
    }
}

/**
 * Chromosome: Represents one complete schedule solution
 */
class Chromosome {
    constructor(genes = []) {
        this.genes = genes; // Array of { subject_id, day, start_period, duration, teacher_id, room_id }
        this.fitness = 0;
        this.conflicts = 0;
        this.distributionScore = 0;
    }

    clone() {
        const c = new Chromosome(this.genes.map(g => ({ ...g })));
        c.fitness = this.fitness;
        c.conflicts = this.conflicts;
        c.distributionScore = this.distributionScore;
        return c;
    }
}

/**
 * GeneticScheduler: Main GA Engine
 */
export class GeneticScheduler {
    constructor(subjects, rooms, teachers, existingSchedules = [], config = {}) {
        this.subjects = subjects;
        this.rooms = rooms;
        this.teachers = teachers;
        this.existingSchedules = existingSchedules;
        this.config = { ...GA_CONFIG, ...config };
        this.rng = new SeededRandom(this.config.SEED || Date.now());

        // Pre-process data
        this.labRooms = rooms.filter(r => r.type?.match(/lab|workshop|ปฏิบัติ/i));
        this.regularRooms = rooms.filter(r => !this.labRooms.includes(r));

        // Build existing schedule lookup for conflict checking
        this.existingSlots = this.buildExistingSlotLookup();

        // Statistics
        this.stats = {
            generations: 0,
            bestFitness: 0,
            worstFitness: 0,
            avgFitness: 0,
            convergenceHistory: []
        };
    }

    buildExistingSlotLookup() {
        const lookup = {};
        this.existingSchedules.forEach(slot => {
            for (let p = slot.start_period; p <= slot.end_period; p++) {
                const key = `${slot.day_of_week}-${p}`;
                if (!lookup[key]) lookup[key] = { rooms: new Set(), teachers: new Set() };
                if (slot.roomId || slot.room_id) lookup[key].rooms.add(slot.roomId || slot.room_id);
                if (slot.teacherId || slot.teacher_id) lookup[key].teachers.add(slot.teacherId || slot.teacher_id);
            }
        });
        return lookup;
    }

    /**
     * Create subject queue (break into chunks)
     */
    createSubjectQueue() {
        const queue = [];
        this.subjects.forEach(sub => {
            let theoryLeft = sub.theoryHours || 0;
            let practiceLeft = sub.practiceHours || 0;

            while (theoryLeft > 0) {
                let dur = Math.min(theoryLeft, 2);
                if (theoryLeft === 3) dur = 3;
                queue.push({
                    subject_id: sub.subjectId || sub.id,
                    subject_code: sub.code,
                    subject_name: sub.name,
                    teacher_id: sub.teacherId,
                    duration: dur,
                    isPractice: false
                });
                theoryLeft -= dur;
            }

            while (practiceLeft > 0) {
                let dur = Math.min(practiceLeft, 4);
                queue.push({
                    subject_id: sub.subjectId || sub.id,
                    subject_code: sub.code,
                    subject_name: sub.name,
                    teacher_id: sub.teacherId,
                    duration: dur,
                    isPractice: true
                });
                practiceLeft -= dur;
            }
        });
        return queue;
    }

    /**
     * Generate random initial chromosome
     */
    /**
     * Generate random initial chromosome (Pure Stochastic)
     */
    generateRandomChromosome() {
        const queue = this.rng.shuffle(this.createSubjectQueue());
        const genes = [];
        const occupied = {};

        const isSlotFree = (day, start, duration, roomId, teacherId) => {
            for (let i = 0; i < duration; i++) {
                const p = start + i;
                if (p === LUNCH_PERIOD || p > MAX_PERIOD) return false;

                // Note: We ALLOW lunch crossing in generation now (to be "Pure AI"), 
                // but fitness will penalize it heavily.

                const key = `${day}-${p}`;
                if (this.existingSlots[key]) {
                    if (roomId && this.existingSlots[key].rooms.has(roomId)) return false;
                    if (teacherId && this.existingSlots[key].teachers.has(teacherId)) return false;
                }
                if (occupied[key]) {
                    if (occupied[key].class) return false;
                    if (roomId && occupied[key].rooms.has(roomId)) return false;
                    if (teacherId && occupied[key].teachers.has(teacherId)) return false;
                }
            }
            return true;
        };

        for (const item of queue) {
            let placed = false;
            // Pure Random: Shuffle Days and Periods
            const shuffledDays = this.rng.shuffle([...DAYS]);

            // All possible start periods (1..9)
            const allPeriods = [];
            for (let p = 1; p <= MAX_PERIOD; p++) allPeriods.push(p);
            const shuffledPeriods = this.rng.shuffle(allPeriods);

            // All rooms shuffled (No Type Preference hardcoded)
            const shuffledRooms = this.rng.shuffle([...this.rooms]);

            for (const day of shuffledDays) {
                for (const start of shuffledPeriods) {
                    if (start + item.duration - 1 > MAX_PERIOD) continue;

                    // Try random rooms
                    let roomId = null;
                    for (const r of shuffledRooms) {
                        if (isSlotFree(day, start, item.duration, r.id, null)) {
                            roomId = r.id;
                            break;
                        }
                    }

                    if (roomId && isSlotFree(day, start, item.duration, roomId, item.teacher_id)) {
                        genes.push({
                            subject_id: item.subject_id,
                            subject_code: item.subject_code,
                            subject_name: item.subject_name,
                            day_of_week: day,
                            start_period: start,
                            end_period: start + item.duration - 1,
                            duration: item.duration,
                            teacher_id: item.teacher_id,
                            room_id: roomId,
                            isPractice: item.isPractice // Track for fitness check
                        });

                        // Mark occupied
                        for (let i = 0; i < item.duration; i++) {
                            const p = start + i;
                            const key = `${day}-${p}`;
                            if (!occupied[key]) occupied[key] = { rooms: new Set(), teachers: new Set(), class: false };
                            occupied[key].rooms.add(roomId);
                            if (item.teacher_id) occupied[key].teachers.add(item.teacher_id);
                            occupied[key].class = true;
                        }

                        placed = true;
                        break;
                    }
                }
                if (placed) break;
            }

            // Fallback: Random placement even if conflicts (Evolution will fix it)
            if (!placed) {
                const day = this.rng.choice(DAYS);
                const start = this.rng.nextInt(1, MAX_PERIOD - item.duration + 1);
                const roomId = this.rooms.length > 0 ? this.rng.choice(this.rooms).id : null;

                genes.push({
                    subject_id: item.subject_id,
                    subject_code: item.subject_code,
                    subject_name: item.subject_name,
                    day_of_week: day,
                    start_period: start,
                    end_period: start + item.duration - 1,
                    duration: item.duration,
                    teacher_id: item.teacher_id,
                    room_id: roomId,
                    isPractice: item.isPractice
                });
            }
        }

        return new Chromosome(genes);
    }

    /**
     * Calculate fitness of a chromosome
     * Higher fitness = better solution
     */
    calculateFitness(chromosome) {
        let conflicts = 0;
        let distributionScore = 0;

        const slotUsage = {};
        const dayLoad = {};
        DAYS.forEach(d => dayLoad[d] = { morning: 0, afternoon: 0 });

        // Build lookup for Room Types
        const roomTypeLookup = {};
        this.rooms.forEach(r => roomTypeLookup[r.id] = r.type);

        // Track conflicts
        for (const gene of chromosome.genes) {
            // Check Room Suitability (Evolutionary Constraint)
            if (gene.room_id && roomTypeLookup[gene.room_id]) {
                const type = roomTypeLookup[gene.room_id].toLowerCase();
                const isLabRoom = type.includes('lab') || type.includes('workshop') || type.includes('ปฏิบัติ');

                if (gene.isPractice && !isLabRoom) conflicts += 5; // Practice needs Lab
                if (!gene.isPractice && isLabRoom) conflicts += 2; // Theory shouldn't hug Labs
            }

            for (let p = gene.start_period; p <= gene.end_period; p++) {
                const classKey = `class-${gene.day_of_week}-${p}`;
                const roomKey = `room-${gene.room_id}-${gene.day_of_week}-${p}`;
                const teacherKey = `teacher-${gene.teacher_id}-${gene.day_of_week}-${p}`;

                // Class conflict (same period)
                if (slotUsage[classKey]) conflicts += 10;
                slotUsage[classKey] = true;

                // Room conflict
                if (gene.room_id && slotUsage[roomKey]) conflicts += 5;
                if (gene.room_id) slotUsage[roomKey] = true;

                // Teacher conflict
                if (gene.teacher_id && slotUsage[teacherKey]) conflicts += 5;
                if (gene.teacher_id) slotUsage[teacherKey] = true;

                // Lunch period violation
                if (p === LUNCH_PERIOD) conflicts += 20;

                // Track load
                if (p <= 4) dayLoad[gene.day_of_week].morning++;
                else if (p >= 6) dayLoad[gene.day_of_week].afternoon++;
            }
        }

        // Distribution score: reward balanced days, penalize empty days
        let daysWithMorning = 0;
        let totalBalance = 0;

        // Calculate Gaps (Encourage Contiguous Schedule)
        for (const day of DAYS) {
            const load = dayLoad[day];

            // Find start and end of the day
            let firstPeriod = MAX_PERIOD + 1;
            let lastPeriod = 0;
            const dailySlots = new Set();

            for (const gene of chromosome.genes) {
                if (gene.day_of_week === day) {
                    if (gene.start_period < firstPeriod) firstPeriod = gene.start_period;
                    if (gene.end_period > lastPeriod) lastPeriod = gene.end_period;
                    for (let p = gene.start_period; p <= gene.end_period; p++) dailySlots.add(p);
                }
            }

            if (firstPeriod <= lastPeriod) {
                // Check for gaps (Existing)
                for (let p = firstPeriod; p <= lastPeriod; p++) {
                    if (p === LUNCH_PERIOD) continue;
                    if (!dailySlots.has(p)) {
                        conflicts += 5; // HIGH Penalty for Gap (Make it tight)
                    }
                }
            }

            // Morning Filler Logic (Gravity towards Morning)
            // If there's a class in afternoon, BUT morning has empty slots -> Penalize!
            const morningSlots = [1, 2, 3, 4];
            const emptyMorningSlots = morningSlots.filter(p => !dailySlots.has(p)).length;
            const hasAfternoonClass = Array.from(dailySlots).some(p => p > LUNCH_PERIOD);

            if (hasAfternoonClass && emptyMorningSlots > 0) {
                // Penalty = Number of empty morning slots * 15 (Very Strong Pressure)
                conflicts += (emptyMorningSlots * 15);
            }

            // Distribution Score upgrades
            if (load.morning >= 3) {
                daysWithMorning++;
                distributionScore += 20; // Big bonus for full mornings
            }
            if (load.afternoon > 0 && load.morning < 3) {
                // Afternoon without full morning = bad
                conflicts += 5;
            }
            // Balance bonus
            totalBalance += Math.abs(load.morning - 3); // Ideal: 3-4 morning periods
        }

        distributionScore += daysWithMorning * 5;
        distributionScore -= totalBalance * 2;

        // Final fitness (higher is better)
        const fitness = 1000 - (conflicts * 10) + distributionScore;

        chromosome.fitness = Math.max(0, fitness);
        chromosome.conflicts = conflicts;
        chromosome.distributionScore = distributionScore;

        return chromosome.fitness;
    }

    /**
     * Tournament Selection
     */
    tournamentSelect(population) {
        const tournament = [];
        for (let i = 0; i < this.config.TOURNAMENT_SIZE; i++) {
            tournament.push(this.rng.choice(population));
        }
        tournament.sort((a, b) => b.fitness - a.fitness);
        return tournament[0];
    }

    /**
     * Crossover: Day-based crossover
     */
    crossover(parent1, parent2) {
        if (this.rng.next() > this.config.CROSSOVER_RATE) {
            return [parent1.clone(), parent2.clone()];
        }

        const crossPoint = this.rng.nextInt(0, DAYS.length - 1);
        const child1Genes = [];
        const child2Genes = [];

        for (const gene of parent1.genes) {
            const dayIndex = DAYS.indexOf(gene.day_of_week);
            if (dayIndex <= crossPoint) child1Genes.push({ ...gene });
            else child2Genes.push({ ...gene });
        }

        for (const gene of parent2.genes) {
            const dayIndex = DAYS.indexOf(gene.day_of_week);
            if (dayIndex <= crossPoint) child2Genes.push({ ...gene });
            else child1Genes.push({ ...gene });
        }

        return [new Chromosome(child1Genes), new Chromosome(child2Genes)];
    }

    /**
     * Mutation: Random slot move
     */
    mutate(chromosome) {
        if (this.rng.next() > this.config.MUTATION_RATE) return;

        if (chromosome.genes.length === 0) return;

        const geneIndex = this.rng.nextInt(0, chromosome.genes.length - 1);
        const gene = chromosome.genes[geneIndex];

        // Random mutation type
        const mutationType = this.rng.nextInt(1, 3);

        switch (mutationType) {
            case 1: // Change day
                gene.day_of_week = this.rng.choice(DAYS);
                break;
            case 2: // Change period
                const periods = [...MORNING_PERIODS, ...AFTERNOON_PERIODS];
                const validPeriods = periods.filter(p => p + gene.duration - 1 <= MAX_PERIOD);
                if (validPeriods.length > 0) {
                    gene.start_period = this.rng.choice(validPeriods);
                    gene.end_period = gene.start_period + gene.duration - 1;
                }
                break;
            case 3: // Change room
                if (this.rooms.length > 0) {
                    gene.room_id = this.rng.choice(this.rooms).id;
                }
                break;
        }
    }

    /**
     * Run the Genetic Algorithm
     */
    evolve(onProgress = null) {
        const startTime = Date.now();

        // Initialize population
        let population = [];
        for (let i = 0; i < this.config.POPULATION_SIZE; i++) {
            const chromosome = this.generateRandomChromosome();
            this.calculateFitness(chromosome);
            population.push(chromosome);
        }

        // Evolution loop
        for (let gen = 0; gen < this.config.GENERATIONS; gen++) {
            // Sort by fitness (descending)
            population.sort((a, b) => b.fitness - a.fitness);

            // Track stats
            const best = population[0];
            const worst = population[population.length - 1];
            const avg = population.reduce((s, c) => s + c.fitness, 0) / population.length;

            this.stats = {
                generations: gen + 1,
                bestFitness: best.fitness,
                worstFitness: worst.fitness,
                avgFitness: avg,
                bestConflicts: best.conflicts,
                convergenceHistory: [...(this.stats.convergenceHistory || []), best.fitness]
            };

            // Early termination if perfect solution
            if (best.conflicts === 0 && best.fitness >= 900) {
                if (onProgress) onProgress(this.stats, 'converged');
                break;
            }

            // Progress callback
            if (onProgress && gen % 10 === 0) {
                onProgress(this.stats, 'evolving');
            }

            // Create new population
            const newPopulation = [];

            // Elitism: keep best chromosomes
            for (let i = 0; i < this.config.ELITE_COUNT; i++) {
                newPopulation.push(population[i].clone());
            }

            // Generate rest through selection, crossover, mutation
            while (newPopulation.length < this.config.POPULATION_SIZE) {
                const parent1 = this.tournamentSelect(population);
                const parent2 = this.tournamentSelect(population);
                const [child1, child2] = this.crossover(parent1, parent2);

                this.mutate(child1);
                this.mutate(child2);

                this.calculateFitness(child1);
                this.calculateFitness(child2);

                newPopulation.push(child1);
                if (newPopulation.length < this.config.POPULATION_SIZE) {
                    newPopulation.push(child2);
                }
            }

            population = newPopulation;
        }

        // Final sort
        population.sort((a, b) => b.fitness - a.fitness);
        const bestSolution = population[0];

        const elapsed = Date.now() - startTime;
        this.stats.elapsedMs = elapsed;

        return {
            schedule: bestSolution.genes,
            fitness: bestSolution.fitness,
            conflicts: bestSolution.conflicts,
            stats: this.stats
        };
    }
}

/**
 * Validation function
 */
export function validateGASchedule(schedule) {
    const conflicts = [];
    const slotUsage = {};

    for (const gene of schedule) {
        for (let p = gene.start_period; p <= gene.end_period; p++) {
            const classKey = `class-${gene.day_of_week}-${p}`;

            if (slotUsage[classKey]) {
                conflicts.push(`${gene.day_of_week} คาบ ${p}: ซ้ำซ้อน`);
            }
            slotUsage[classKey] = gene.subject_code;

            if (p === LUNCH_PERIOD) {
                conflicts.push(`${gene.day_of_week}: ${gene.subject_code} ชนพักเที่ยง`);
            }
        }
    }

    return conflicts;
}
