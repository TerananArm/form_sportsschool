export const printApplicationForm = (app) => {
    // Helper: Dates
    const formatBuddhistDate = (dateStr) => {
        if (!dateStr) return { day: '', month: '', year: '' };
        const d = new Date(dateStr);
        const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        return { day: d.getDate(), month: months[d.getMonth()], year: d.getFullYear() + 543 };
    };
    const birthDate = formatBuddhistDate(app.birthdate);
    const appNum = app.applicationNumber || '';
    const [prefix, suffix] = appNum.includes('-') ? appNum.split('-') : [appNum, ''];

    // Helper: Boxes
    const numBoxes = (str, count) => {
        const s = str ? str.toString().padEnd(count, ' ') : ''.padEnd(count, ' ');
        return `<div style="display:inline-flex; gap:2px; vertical-align:middle;">` +
            s.split('').slice(0, count).map(n =>
                `<div class="num-box">${n !== ' ' ? n : ''}</div>`
            ).join('') + `</div>`;
    };

    // Helper: Value
    const v = (val) => (val && val !== '0' && val !== 0) ? val : '';

    const tnsuLogo = '/images/tnsu-logo.png';
    const eduVal = app.educationLevel || app.currentEducation || '';
    const isPrimary = ['primary', 'ประถมศึกษา'].some(k => eduVal.toLowerCase().includes(k.toLowerCase()));
    const isSecondary = ['secondary', 'มัธยมศึกษา'].some(k => eduVal.toLowerCase().includes(k.toLowerCase()));

    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>ใบสมัครสอบ - ${app.applicationNumber || 'Draft'}</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    font-family: 'Sarabun', sans-serif;
                    font-size: 13.5px; 
                    line-height: 1.3;
                    background: #fff;
                    color: #000;
                }
                @page { size: A4; margin: 0; }
                .page {
                    width: 210mm;
                    height: 297mm; /* Exact A4 height */
                    padding: 10mm 15mm 5mm 15mm; 
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between; 
                    background: white;
                }
                
                @media print {
                    html, body {
                        width: 210mm;
                        height: 297mm;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .page {
                        margin: 0 !important;
                        border: initial;
                        width: initial;
                        min-height: initial;
                        box-shadow: initial;
                        background: initial;
                        page-break-after: always;
                    }
                    /* Hide browser header/footers */
                    @page { margin: 0; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
                .bold { font-weight: bold; }
                
                /* Component: Number Box */
                .num-box {
                    width: 17px; height: 21px; 
                    border: 1px solid #000;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: bold; font-size: 13px; 
                    background: #fff;
                    line-height: 1;
                }

                /* --- HEADER SECTION --- */
                .header-container {
                    display: grid;
                    grid-template-columns: 100px 1fr 220px;
                    align-items: start;
                    margin-bottom: 5px;
                }

                .header-left { padding-top: 5px; }
                .copy-box { 
                    border: 1px solid #000; 
                    padding: 3px 8px; 
                    font-size: 13px; 
                    display:inline-block;
                }

                .header-center { 
                    text-align: center; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    padding-bottom: 5px;
                    margin-left: 100px;
                }
                
                .logo { width: 130px; height: auto; margin-bottom: 5px; }
                
                .uni-name { 
                    font-size: 15px; 
                    font-weight: bold; 
                    margin-bottom: 10px; 
                    line-height: 1.1;
                }
                .ministry { 
                    font-size: 15px; 
                    font-weight: bold;
                    margin-bottom: 10px; 
                }
                .app-title { 
                    font-size: 15px; 
                    font-weight: bold; 
                    margin-bottom: 10px; 
                }

                .header-right { 
                    display: flex; 
                    flex-direction: column; 
                    align-items: flex-end; 
                }
                .exam-no-row {
                    display: flex; 
                    align-items: center; 
                    gap: 3px; 
                    margin-bottom: 5px; 
                    white-space: nowrap; 
                    justify-content: flex-end;
                }
                .photo-area {
                    border: 1px solid #000;
                    width: 3cm; height: 4cm;
                    display: flex; align-items: center; justify-content: center;
                    text-align: center;
                    font-size: 11px;
                    overflow: hidden;
                    background: #fff;
                }
                .photo-img { width: 100%; height: 100%; object-fit: cover; }
                .school-stamp { font-size: 10px; text-align: center; margin-top: 2px; width: 3cm;}

                /* --- FORM ELEMENTS --- */
                .cb-box { 
                    width: 14px; height: 14px; 
                    border: 1px solid #000; 
                    display: inline-block; 
                    position: relative; 
                    margin: 0 4px 0 2px; 
                    vertical-align: text-bottom;
                    background: white;
                }
                .cb-box.checked::after { 
                    content: ''; position: absolute; left: 3px; top: 1px; width: 4px; height: 8px; 
                    border: solid #000; border-width: 0 2px 2px 0; transform: rotate(45deg); 
                }
                
                .circle-box { 
                    width: 14px; height: 14px; 
                    border: 1px solid #000; 
                    border-radius: 50%; 
                    display: inline-block; 
                    position: relative; 
                    margin: 0 4px 0 2px; 
                    vertical-align: text-bottom;
                    background: white;
                }
                .circle-box.checked::after { 
                    content: ''; position: absolute; top: 3px; left: 3px; width: 6px; height: 6px; 
                    background: #000; border-radius: 50%; 
                }

                .row {
                    display: flex; align-items: flex-end;
                    margin-bottom: 2px;
                    flex-wrap: nowrap; white-space: nowrap; width: 100%;
                }
                .indent { padding-left: 40px; } 
                .label { margin-right: 4px; font-weight: normal; }
                .input {
                    border-bottom: 1px dotted #000;
                    text-align: center; padding: 0 2px; height: 19px; line-height: 19px;
                    font-weight: bold; color: #000; display: inline-block;
                }
                
                /* Signature Section */
                .sig-section { 
                    display: flex; 
                    flex-direction: column; 
                    align-items: flex-end; 
                    margin-top: 20px; 
                    padding-right: 20px; 
                }

                .sig-row { 
                    text-align: center; 
                    margin-bottom: 25px;
                    width: 350px;
                    font-size: 13.5px; 
                    white-space: nowrap;
                    line-height: 2.2;
                }

                /* Cut Line */
                .cut-line { 
                    border-top: 1px dashed #000; 
                    margin: 5px 0; 
                    position: relative; 
                    width: 100%; 
                }
                .scissors { position: absolute; top: -14px; left: 0; font-size: 20px; background: white; padding-right: 5px; transform: rotate(180deg); }

                /* Bottom Card (บัตรประจำตัว) */
                .bottom-card { 
                    padding-top: 0px;
                }
                
                @media print {
                    .page { margin: 0; border: none; width: 210mm; height: 296mm; page-break-after: always; overflow: hidden; }
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="page">
                <div>
                    <div class="header-container">
                        <div class="header-left">
                            <div class="copy-box">ถ่ายเอกสารได้</div>
                        </div>
                        <div class="header-center">
                            <img src="${tnsuLogo}" class="logo">
                            <div class="uni-name">มหาวิทยาลัยการกีฬาแห่งชาติ</div>
                            <div class="ministry">กระทรวงการท่องเที่ยวและกีฬา</div>
                            <div class="app-title">ใบสมัครสอบ ปีการศึกษา 2569</div>
                        </div>
                        <div class="header-right">
                            <div class="exam-no-row">
                                <span class="bold" style="font-size:14px;">เลขที่สมัครสอบ</span>
                                ${numBoxes(prefix, 2)}
                                <span style="font-weight:bold;">-</span>
                                ${numBoxes(suffix, 4)}
                            </div>
                            <div class="photo-area">
                                ${app.photoPath ? `<img src="${app.photoPath}" class="photo-img">` : 'ติดรูปถ่าย<br>ขนาด 1 นิ้ว'}
                            </div>
                            <div class="school-stamp">ประทับตราโรงเรียน</div>
                        </div>
                    </div>

                    <div class="row indent" style="margin-top:5px;">
                        <span class="label bold">เพื่อเข้าศึกษาในโรงเรียนกีฬาจังหวัด</span>
                        <span class="input" style="width: 200px;">${v(app.targetSchool)}</span>
                        <span class="label" style="margin-left:5px;">รหัส</span>
                        ${numBoxes(app.schoolCode, 4)}
                    </div>

                    <div class="row">
                        <span class="label bold">ชื่อผู้สมัคร</span>
                        <span class="input" style="flex-grow:1;">${v(app.name)}</span>
                        <span class="label" style="margin-left:5px;">เพศ</span>
                        <span class="cb-box ${app.gender === 'male' ? 'checked' : ''}"></span> <span class="label">ชาย</span>
                        <span class="cb-box ${app.gender === 'female' ? 'checked' : ''}"></span> <span class="label">หญิง</span>
                        <span class="label" style="margin-left:10px;">อายุ</span>
                        <span class="input" style="width: 40px;">${v(app.age)}</span>
                        <span class="label">ปี</span>
                    </div>

                    <div class="row">
                        <span class="label">เกิดวันที่</span>
                        <span class="input" style="width: 35px;">${v(birthDate.day)}</span>
                        <span class="label">เดือน</span>
                        <span class="input" style="width: 80px;">${v(birthDate.month)}</span>
                        <span class="label">พ.ศ.</span>
                        <span class="input" style="width: 50px;">${v(birthDate.year)}</span>
                        <span class="label">เชื้อชาติ</span>
                        <span class="input" style="width: 60px;">${v(app.race)}</span>
                        <span class="label">สัญชาติ</span>
                        <span class="input" style="width: 60px;">${v(app.nationality)}</span>
                        <span class="label">ศาสนา</span>
                        <span class="input" style="flex-grow:1;">${v(app.religion)}</span>
                    </div>

                    <div class="row">
                        <span class="label">ส่วนสูง</span>
                        <span class="input" style="width: 50px;">${v(app.height)}</span>
                        <span class="label">เซนติเมตร</span>
                        <span class="label" style="margin-left:15px;">น้ำหนัก</span>
                        <span class="input" style="width: 50px;">${v(app.weight)}</span>
                        <span class="label">กิโลกรัม</span>
                    </div>

                    <div class="row">
                        <span class="label">บิดาชื่อ – สกุล</span>
                        <span class="input" style="width: 180px;">${v(app.fatherName)}</span>
                        <span class="label">อาชีพ</span>
                        <span class="input" style="width: 90px;">${v(app.fatherOccupation)}</span>
                        <span class="label">เชื้อชาติ</span>
                        <span class="input" style="width: 45px;">${v(app.fatherRace)}</span>
                        <span class="label">สัญชาติ</span>
                        <span class="input" style="width: 45px;">${v(app.fatherNationality)}</span>
                        <span class="label">ศาสนา</span>
                        <span class="input" style="flex-grow:1;">${v(app.fatherReligion)}</span>
                    </div>

                    <div class="row">
                        <span class="label">บิดาเคยเป็นนักกีฬา</span>
                        <span class="input" style="width: 130px;">${v(app.fatherSport)}</span>
                        <span class="label">ระดับการแข่งขัน</span>
                        <span class="input" style="flex-grow:1;">${v(app.fatherSportLevel)}</span>
                        <span class="label">ส่วนสูง</span>
                        <span class="input" style="width: 45px;">${v(app.fatherHeight)}</span>
                        <span class="label">เซนติเมตร</span>
                    </div>

                    <div class="row">
                        <span class="label">มารดาชื่อ – สกุล</span>
                        <span class="input" style="width: 180px;">${v(app.motherName)}</span>
                        <span class="label">อาชีพ</span>
                        <span class="input" style="width: 90px;">${v(app.motherOccupation)}</span>
                        <span class="label">เชื้อชาติ</span>
                        <span class="input" style="width: 45px;">${v(app.motherRace)}</span>
                        <span class="label">สัญชาติ</span>
                        <span class="input" style="width: 45px;">${v(app.motherNationality)}</span>
                        <span class="label">ศาสนา</span>
                        <span class="input" style="flex-grow:1;">${v(app.motherReligion)}</span>
                    </div>

                    <div class="row">
                        <span class="label">มารดาเคยเป็นนักกีฬา</span>
                        <span class="input" style="width: 130px;">${v(app.motherSport)}</span>
                        <span class="label">ระดับการแข่งขัน</span>
                        <span class="input" style="flex-grow:1;">${v(app.motherSportLevel)}</span>
                        <span class="label">ส่วนสูง</span>
                        <span class="input" style="width: 45px;">${v(app.motherHeight)}</span>
                        <span class="label">เซนติเมตร</span>
                    </div>

                    <div class="row">
                        <span class="label">ที่อยู่ที่ติดต่อได้สะดวก บ้านเลขที่</span>
                        <span class="input" style="width: 50px;">${v(app.houseNumber)}</span>
                        <span class="label">หมู่ที่</span>
                        <span class="input" style="width: 30px;">${v(app.village)}</span>
                        <span class="label">ถนน</span>
                        <span class="input" style="width: 100px;">${v(app.road)}</span>
                        <span class="label">ตำบล</span>
                        <span class="input" style="flex-grow:1;">${v(app.subDistrict)}</span>
                    </div>

                    <div class="row">
                        <span class="label">อำเภอ</span>
                        <span class="input" style="width: 110px;">${v(app.district)}</span>
                        <span class="label">จังหวัด</span>
                        <span class="input" style="width: 110px;">${v(app.province)}</span>
                        <span class="label">รหัสไปรษณีย์</span>
                        <span class="input" style="width: 70px;">${v(app.postalCode)}</span>
                        <span class="label">โทรศัพท์</span>
                        <span class="input" style="flex-grow:1;">${v(app.phone)}</span>
                    </div>

                    <div class="row bold" style="margin-top:5px;">
                        สถานภาพทางการศึกษา ในปีการศึกษาปัจจุบัน 2568
                    </div>
                    <div class="row indent">
                        <span class="label">กำลังศึกษาในชั้น</span>
                        <span class="cb-box ${isPrimary ? 'checked' : ''}"></span> <span class="label">ประถมศึกษา</span>
                        <span class="cb-box ${isSecondary ? 'checked' : ''}"></span> <span class="label">มัธยมศึกษา</span>
                        <span class="label" style="margin-left:auto;">ปีที่</span>
                        <span class="input" style="width: 40px;">${v(app.educationYear)}</span>
                        <span class="label">โรงเรียน</span>
                        <span class="input" style="flex-grow:1;">${v(app.schoolName)}</span>
                    </div>
                    <div class="row">
                        <span class="label">ตำบล</span>
                        <span class="input" style="width: 110px;">${v(app.schoolSubDistrict)}</span>
                        <span class="label">อำเภอ</span>
                        <span class="input" style="width: 110px;">${v(app.schoolDistrict)}</span>
                        <span class="label">จังหวัด</span>
                        <span class="input" style="width: 110px;">${v(app.schoolProvince)}</span>
                        <span class="label">รหัสไปรษณีย์</span>
                        <span class="input" style="flex-grow:1;">${v(app.schoolPostalCode)}</span>
                    </div>
                    <div class="row">
                        <span class="label">สมัครเข้าศึกษาต่อในชั้น</span>
                        <span class="input" style="width: 140px;">${v(app.appliedLevel)}</span>
                        <span class="label">ชนิดกีฬา</span>
                        <span class="input" style="flex-grow:1;">${v(app.sportType)}</span>
                        <span class="label">รหัส</span>
                        ${numBoxes(app.sportCode, 3)}
                    </div>

                    <div class="row bold" style="margin-top:5px;">หลักฐานการสมัคร</div>
                    <div style="margin-left: 30px;">
                        <div class="row" style="margin-bottom:1px;">
                            <span class="circle-box ${app.eduDocCount ? 'checked' : ''}"></span> <span class="label">หลักฐานการศึกษา จำนวน</span>
                            <span class="input" style="width: 40px;">${v(app.eduDocCount)}</span> <span class="label">ฉบับ</span>
                        </div>
                        <div class="row" style="margin-bottom:1px;">
                            <span class="circle-box ${app.houseRegCount ? 'checked' : ''}"></span> <span class="label">ทะเบียนบ้าน จำนวน</span>
                            <span class="input" style="width: 40px;">${v(app.houseRegCount)}</span> <span class="label">ฉบับ</span>
                        </div>
                        <div class="row" style="margin-bottom:1px;">
                            <span class="circle-box ${app.idCardCount ? 'checked' : ''}"></span> <span class="label">บัตรประจำตัวประชาชนหรือสูติบัตร จำนวน</span>
                            <span class="input" style="width: 40px;">${v(app.idCardCount)}</span> <span class="label">ฉบับ</span>
                        </div>
                        <div class="row" style="margin-bottom:1px;">
                            <span class="circle-box ${app.sportCertCount ? 'checked' : ''}"></span> <span class="label">เกียรติบัตรแสดงความสามารถทางการกีฬา จำนวน</span>
                            <span class="input" style="width: 40px;">${v(app.sportCertCount)}</span> <span class="label">ฉบับ</span>
                        </div>
                        <div class="row" style="margin-bottom:1px;">
                            <span class="circle-box ${app.nameChangeCount ? 'checked' : ''}"></span> <span class="label">หลักฐานการเปลี่ยนชื่อ – สกุล จำนวน</span>
                            <span class="input" style="width: 40px;">${v(app.nameChangeCount)}</span> <span class="label">ฉบับ</span>
                        </div>
                        <div class="row" style="margin-bottom:1px;">
                            <span class="circle-box ${app.otherDocsCount ? 'checked' : ''}"></span> <span class="label">เอกสารประกอบการสมัครอื่นๆ (ระบุ)</span>
                            <span class="input" style="width: 170px; text-align:left;">${v(app.otherDocsDesc)}</span>
                            <span class="label">จำนวน</span>
                            <span class="input" style="width: 40px;">${v(app.otherDocsCount)}</span> <span class="label">ฉบับ</span>
                        </div>
                    </div>

                    <div class="sig-section">
                        <div class="sig-row">
                            ลงชื่อ..........................................................ผู้สมัครสอบ<br>
                            (..........................................................)
                        </div>
                        <div class="sig-row">
                            ลงชื่อ..........................................................เจ้าหน้าที่รับสมัคร<br>
                            (..........................................................)
                        </div>
                    </div>
                </div>

                <div class="cut-line">
                    <div class="scissors">✂</div>
                </div>

                <div class="bottom-card" style="position: relative; padding-top: 10px;">
                    <div style="position: absolute; left: 0; right: 0; top: 0; text-align: center; pointer-events: none; z-index: 0;">
                        <img src="${tnsuLogo}" style="height: 75px; background:white;"> 
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 1;">
                        
                        <div style="flex-grow: 1; margin-right: 15px;">
                            
                            <div style="margin-bottom: 30px;"> 
                                <div style="display: inline-block; border: 1px solid #000; padding: 5px 10px; font-weight: bold; font-size: 14px; background: white;">
                                    ให้นำบัตรนี้มาแสดงทุกครั้ง
                                </div>
                                <div class="bold" style="font-size:14px; margin-top: 5px;">
                                    บัตรประจำตัวผู้สมัคร ปีการศึกษา 2569
                                </div>
                            </div>

                            <div class="row" style="margin-bottom: 8px;">
                                <span class="label bold">ชื่อผู้สมัคร</span>
                                <span class="input" style="flex-grow: 1; text-align: left;">${v(app.name)}</span>
                            </div>
                            
                            <div class="row" style="margin-bottom: 8px;">
                                <span class="label bold">เพื่อเข้าศึกษาในโรงเรียนกีฬาจังหวัด</span>
                                <span class="input" style="flex-grow: 1; text-align: left;">${v(app.targetSchool)}</span>
                                <span class="label bold" style="margin-left: 5px;">รหัส</span>
                                ${numBoxes(app.schoolCode, 4)}
                            </div>
                            
                            <div class="row" style="margin-bottom: 8px;">
                                <div style="width: 80px; text-align: left; margin-right: 5px;" class="bold">ชนิดกีฬา</div>
                                <span class="input" style="flex-grow: 1; text-align: left;">${v(app.sportType)}</span>
                                <span class="label bold" style="margin-left: 5px;">รหัส</span>
                                ${numBoxes(app.sportCode, 3)}
                            </div>
                        </div>

                        <div style="flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end;">
                            
                            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 5px; height: 33px;">
                                <span class="bold" style="font-size: 14px;">เลขที่สมัครสอบ</span>
                                ${numBoxes(prefix, 2)}
                                <span style="font-weight: bold;">-</span>
                                ${numBoxes(suffix, 4)}
                            </div>

                            <div style="display: flex; flex-direction: column; align-items: center; width: 3.5cm;">
                                <div class="photo-area" style="height: 4cm; width: 3cm; border: 1px solid #000; margin-bottom: 5px; background: white;">
                                    ${app.photoPath ? `<img src="${app.photoPath}" class="photo-img">` : '<div style="display:flex; flex-direction:column; justify-content:center; height:100%;"><p>ติดรูปถ่าย</p><p>ขนาด 1 นิ้ว</p></div>'}
                                </div>
                                <div class="school-stamp" style="font-size: 12px; margin-top: 5px;">ประทับตราโรงเรียน</div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
            <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
    } else {
        alert('Pop-up blocked. Please allow pop-ups for printing.');
    }
};