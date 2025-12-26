// app/lib/multi-agent-scheduler.js
// 🤖 Multi-Agent System for Schedule Optimization
// Implements Plan-Act-Check pattern with multiple specialized agents

import { GeneticScheduler, validateGASchedule } from './genetic-scheduler.js';

/**
 * Agent Base Class
 */
class Agent {
    constructor(name, role) {
        this.name = name;
        this.role = role;
        this.logs = [];
    }

    log(message, type = 'info') {
        const entry = {
            agent: this.name,
            message,
            type,
            timestamp: new Date().toISOString()
        };
        this.logs.push(entry);
        return entry;
    }

    getLogs() {
        return this.logs;
    }
}

/**
 * Scheduler Agent: Runs the Genetic Algorithm
 */
class SchedulerAgent extends Agent {
    constructor() {
        super('SchedulerAgent', 'GA Engine');
    }

    async execute(subjects, rooms, teachers, existingSchedules, config) {
        this.log('🧬 Initializing Genetic Algorithm...', 'info');
        this.log(`📊 Population: ${config.POPULATION_SIZE}, Generations: ${config.GENERATIONS}`, 'info');
        this.log(`🎲 Seed: ${config.SEED || 'Random'}`, 'info');

        const ga = new GeneticScheduler(subjects, rooms, teachers, existingSchedules, config);

        let lastProgress = null;
        const result = ga.evolve((stats, status) => {
            if (stats.generations % 20 === 0 || status === 'converged') {
                this.log(`Gen ${stats.generations}: Fitness=${stats.bestFitness.toFixed(0)}, Conflicts=${stats.bestConflicts}`,
                    stats.bestConflicts === 0 ? 'success' : 'info');
            }
            lastProgress = stats;
        });

        this.log(`✅ Evolution complete: ${result.stats.generations} generations`, 'success');
        this.log(`🏆 Best Fitness: ${result.fitness.toFixed(0)}, Conflicts: ${result.conflicts}`,
            result.conflicts === 0 ? 'success' : 'warning');

        return result;
    }
}

/**
 * Conflict Checker Agent: Validates the schedule
 */
class ConflictCheckerAgent extends Agent {
    constructor() {
        super('ConflictChecker', 'Validator');
    }

    execute(schedule, existingSchedules) {
        this.log('🔍 Validating schedule...', 'info');

        const conflicts = validateGASchedule(schedule);

        // Check against existing schedules
        const externalConflicts = this.checkExternalConflicts(schedule, existingSchedules);
        conflicts.push(...externalConflicts);

        if (conflicts.length === 0) {
            this.log('✅ No conflicts detected!', 'success');
        } else {
            this.log(`⚠️ Found ${conflicts.length} conflicts`, 'warning');
            conflicts.slice(0, 5).forEach(c => this.log(`  - ${c}`, 'warning'));
        }

        return {
            valid: conflicts.length === 0,
            conflicts,
            count: conflicts.length
        };
    }

    checkExternalConflicts(schedule, existingSchedules) {
        const conflicts = [];
        const existingLookup = {};

        existingSchedules.forEach(slot => {
            for (let p = slot.start_period; p <= slot.end_period; p++) {
                const teacherKey = `teacher-${slot.teacherId || slot.teacher_id}-${slot.day_of_week}-${p}`;
                const roomKey = `room-${slot.roomId || slot.room_id}-${slot.day_of_week}-${p}`;
                existingLookup[teacherKey] = true;
                existingLookup[roomKey] = true;
            }
        });

        for (const gene of schedule) {
            for (let p = gene.start_period; p <= gene.end_period; p++) {
                const teacherKey = `teacher-${gene.teacher_id}-${gene.day_of_week}-${p}`;
                const roomKey = `room-${gene.room_id}-${gene.day_of_week}-${p}`;

                if (gene.teacher_id && existingLookup[teacherKey]) {
                    conflicts.push(`ครู ID ${gene.teacher_id} ติดสอนห้องอื่นแล้ว (${gene.day_of_week} คาบ ${p})`);
                }
                if (gene.room_id && existingLookup[roomKey]) {
                    conflicts.push(`ห้อง ID ${gene.room_id} ถูกใช้งานแล้ว (${gene.day_of_week} คาบ ${p})`);
                }
            }
        }

        return conflicts;
    }
}

/**
 * Optimizer Agent: Suggests parameter tuning
 */
class OptimizerAgent extends Agent {
    constructor() {
        super('OptimizerAgent', 'Tuner');
    }

    analyze(stats, conflicts) {
        this.log('📈 Analyzing optimization results...', 'info');

        const suggestions = [];

        // Analyze convergence
        const history = stats.convergenceHistory || [];
        if (history.length > 10) {
            const early = history.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
            const late = history.slice(-10).reduce((a, b) => a + b, 0) / 10;
            const improvement = ((late - early) / early * 100).toFixed(1);

            this.log(`📊 Fitness improvement: ${improvement}%`, improvement > 10 ? 'success' : 'info');

            if (late - early < 10) {
                suggestions.push('Consider increasing mutation rate for more exploration');
            }
        }

        // Check conflicts
        if (conflicts > 0) {
            suggestions.push(`มี ${conflicts} conflicts - ลองเพิ่ม generations หรือ population size`);
            this.log(`💡 Suggestion: Increase iterations to reduce conflicts`, 'info');
        } else {
            this.log('🎯 Optimal solution found!', 'success');
        }

        // Report final metrics
        this.log(`⏱️ Total time: ${stats.elapsedMs}ms`, 'info');
        this.log(`🏆 Final fitness: ${stats.bestFitness}`, 'success');

        return {
            suggestions,
            metrics: {
                fitness: stats.bestFitness,
                conflicts: stats.bestConflicts,
                generations: stats.generations,
                elapsedMs: stats.elapsedMs
            }
        };
    }
}

/**
 * Coordinator Agent: Orchestrates the Plan-Act-Check loop
 */
export class CoordinatorAgent extends Agent {
    constructor() {
        super('Coordinator', 'Orchestrator');
        this.schedulerAgent = new SchedulerAgent();
        this.conflictChecker = new ConflictCheckerAgent();
        this.optimizerAgent = new OptimizerAgent();
    }

    async run(subjects, rooms, teachers, existingSchedules, options = {}) {
        const startTime = Date.now();
        const seed = options.seed || Date.now();

        this.log('🚀 Starting Multi-Agent Scheduling System', 'info');
        this.log(`📋 Subjects: ${subjects.length}, Rooms: ${rooms.length}, Teachers: ${teachers.length}`, 'info');

        // ========== PLAN PHASE ==========
        this.log('📝 PHASE 1: PLANNING', 'info');
        const config = {
            POPULATION_SIZE: options.populationSize || 50,
            GENERATIONS: options.generations || 100,
            MUTATION_RATE: options.mutationRate || 0.15,
            CROSSOVER_RATE: 0.8,
            ELITE_COUNT: 5,
            TOURNAMENT_SIZE: 5,
            SEED: seed
        };

        this.log(`🔧 Config: Pop=${config.POPULATION_SIZE}, Gen=${config.GENERATIONS}, Seed=${seed}`, 'info');

        // ========== ACT PHASE ==========
        this.log('⚡ PHASE 2: EXECUTION', 'info');

        let result;
        let attempts = 0;
        const maxAttempts = options.maxRetries || 3;

        while (attempts < maxAttempts) {
            attempts++;
            this.log(`🔄 Attempt ${attempts}/${maxAttempts}`, 'info');

            result = await this.schedulerAgent.execute(subjects, rooms, teachers, existingSchedules, config);

            // ========== CHECK PHASE ==========
            this.log('🔍 PHASE 3: VERIFICATION', 'info');
            const validation = this.conflictChecker.execute(result.schedule, existingSchedules);

            if (validation.valid || attempts >= maxAttempts) {
                break;
            }

            // Adjust and retry
            this.log(`⚠️ Conflicts found, adjusting parameters...`, 'warning');
            config.GENERATIONS += 50;
            config.MUTATION_RATE = Math.min(0.3, config.MUTATION_RATE + 0.05);
            config.SEED = Date.now(); // New seed for retry
        }

        // ========== OPTIMIZE PHASE ==========
        this.log('📈 PHASE 4: OPTIMIZATION ANALYSIS', 'info');
        const optimization = this.optimizerAgent.analyze(result.stats, result.conflicts);

        // Collect all logs
        const allLogs = [
            ...this.logs,
            ...this.schedulerAgent.getLogs(),
            ...this.conflictChecker.getLogs(),
            ...this.optimizerAgent.getLogs()
        ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const totalTime = Date.now() - startTime;

        return {
            success: result.conflicts === 0,
            schedule: result.schedule,
            stats: {
                ...result.stats,
                totalTimeMs: totalTime,
                seed: seed,
                attempts: attempts
            },
            metrics: optimization.metrics,
            suggestions: optimization.suggestions,
            logs: allLogs,
            comparison: {
                method: 'Genetic Algorithm (Multi-Agent)',
                fitness: result.fitness,
                conflicts: result.conflicts,
                generations: result.stats.generations,
                seed: seed,
                reproducible: true,
                timestamp: new Date().toISOString()
            }
        };
    }
}

/**
 * Main entry point for the Multi-Agent Scheduler
 */
export async function runMultiAgentScheduler(subjects, rooms, teachers, existingSchedules, options = {}) {
    const coordinator = new CoordinatorAgent();
    return await coordinator.run(subjects, rooms, teachers, existingSchedules, options);
}
