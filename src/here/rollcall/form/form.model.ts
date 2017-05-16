import * as _ from 'lodash';

import {Label, LabelArrayMap, LabelMap} from 'core/models';
import {LeaveType, LeaveTypeNames} from '../../leave/shared/form.model';

export enum RollcallType {
    None = 0,
    Absent = 1,
    Late = 2,
    Early = 3,
    LateEarly = 5,
    Attend = 6,
}

// {0: 'none', 1: 'absent', ...}
const RollcallTypeNames = _.fromPairs(_.toPairs(RollcallType).filter(p => !/\d+/.test(p[0])).map(p => [p[1], _.camelCase(p[0])]));

// {'none': 0, absent: 0, ...}
const RollcallTypeCounts = _.transform(RollcallTypeNames, (result, value) => result[value] = 0);

export const RollcallActionLabels: LabelMap = {
    [RollcallType.Absent]: { text: '旷课', class: 'absent'},
    [RollcallType.Late]:   { text: '迟到', class: 'late'},
    [RollcallType.Early]:  { text: '早退', class: 'early'},
    [RollcallType.Attend]: { text: '调课', class: 'attend'},
};

export const RollcallActions = [
    RollcallType.Absent,
    RollcallType.Late,
    RollcallType.Early,
    RollcallType.Attend,
];

export const RollcallLabels = _.transform(RollcallTypeNames, (result, value, key) => {
    result[key] = RollcallActions.filter(t => {
        return key === t.toString() || key === RollcallType.LateEarly.toString() && (t === RollcallType.Late || t === RollcallType.Early);
    }).map(t => RollcallActionLabels[t]);
}, new Object() as _.Dictionary<Label[]>);

export interface RollcallSettings {
    hideFree: boolean;
    hideLeave: boolean;
    hideCancel: boolean;
    random: number;
}

interface RollcallDto {
    id: number;
    studentId: string;
    type: RollcallType;
}

export class Rollcall {
    id: number;
    type: RollcallType;

    constructor(dto: RollcallDto) {
        this.id = dto.id;
        this.type = dto.type;
    }

    get labels(): Label[] {
        return RollcallLabels[this.type];
    }

    get cancelType(): RollcallType {
        if (this.type === RollcallType.LateEarly) {
            return RollcallType.Early;
        } else {
            return RollcallActions.find(it => this.type === it);
        }
    }

    toggle(type: RollcallType): ToggleResult {
        if (this.type === type) {
            return { op: 'delete' };
        }

        if (this.type === RollcallType.LateEarly) {
            if (type === RollcallType.Late) {
                type = RollcallType.Early;
            } else if (type === RollcallType.Early) {
                type = RollcallType.Late;
            }
        } else if (this.type === RollcallType.Late && type === RollcallType.Early ||
                   type === RollcallType.Late && this.type === RollcallType.Early) {
            type = RollcallType.LateEarly;
        }
        return { op: 'update', type };
    }
}

interface AbsenceDto {
    id: number;
    studentId: string;
}

/* tslint:disable:max-classes-per-file*/
abstract class Absence {
    constructor(public id: number) {}
    abstract get label(): string;
    abstract get url(): string;
}

interface StudentLeaveDto extends AbsenceDto {
    type: LeaveType;
}

class StudentLeave extends Absence {
    type: LeaveType;

    constructor(dto: StudentLeaveDto) {
        super(dto.id);
        this.type = dto.type;
    }

    get label(): string {
        return LeaveTypeNames[this.type];
    }

    get url(): string {
        return 'leaves';
    }
}

interface FreeListenDto extends AbsenceDto {}

class FreeListen extends Absence {
    constructor(dto: FreeListenDto) {
        super(dto.id);
    }

    get label(): string {
        return '免听';
    }

    get url(): string {
        return 'freeListens';
    }
}

interface CancelExamDto extends AbsenceDto {}

class CancelExam extends Absence {
    id: number;
    constructor(dto: CancelExamDto) {
        super(dto.id);
    }

    get label(): string {
        return '取消考试';
    }

    get url(): string {
        return 'cancelExams';
    }
}

export interface RollcallFormDto {
    students: any[];
    rollcalls: RollcallDto[];
    leaves: StudentLeaveDto[];
    freeListens: FreeListenDto[];
    cancelExams: CancelExamDto[];
    randomFactors: {[key: string]: number};
    locked: boolean;
}

export interface ToggleResult {
    op: 'insert' | 'update' | 'delete' | 'none';
    type?: RollcallType;
}

export class Student {
    index: number;
    id: string;
    name: string;
    taskScheduleId: string;
    adminClass: string;
    subject: string;
    attendances: number[];
    rollcall: Rollcall;
    absence: Absence;
    visible = true;
    pending = false;

    constructor(index: number, dto: any) {
        this.index = index;
        this.id = dto.id;
        this.name = dto.name;
        this.taskScheduleId = dto.taskScheduleId;
        this.adminClass = dto.adminClass;
        this.subject = dto.subject;
        this.attendances = [0, 0, 0, 0];
    }

    toggle(type: RollcallType): ToggleResult {
        if (this.pending || this.absence) {
            return { op: 'none' };
        }

        // List view中按回车键时type为空
        if (!type) {
            type = this.rollcall ? this.rollcall.cancelType : RollcallType.Absent;
        }

        return this.rollcall ? this.rollcall.toggle(type) : { op: 'insert', type};
    }

    get rollcallType(): RollcallType {
        return this.rollcall ? this.rollcall.type : RollcallType.None;
    }
}

export class RollcallForm {
    students: Student[] = [];
    settings: RollcallSettings;
    locked: boolean;
    visibleStudents: Student[] = [];
    randomFactors: {[key: string]: number};

    summaryCounter = {
        total: 0,
        free: 0,
        leave: 0,
        cancel: 0,
        visible: 0,
    };

    activeIndex = 0;

    private studentsMap: { [key: string]: Student } = {};

    constructor(dto: RollcallFormDto, settings: RollcallSettings) {
        this.settings = settings;
        this.locked = dto.locked;
        this.randomFactors = dto.randomFactors;

        dto.students.forEach((s, index) => {
            const student = new Student(index + 1, s);
            this.studentsMap[student.id] = student;
            this.students.push(student);
        });

        this.summaryCounter.total = this.students.length;

        this.update(dto);
        this.applySettings();
    }

    update(dto: RollcallFormDto) {
        this.students.forEach(it => {
            it.rollcall = null;
            it.absence = null;
        });

        dto.rollcalls.forEach(it => {
            const student = this.studentsMap[it.studentId];
            student.rollcall = new Rollcall(it);
        });

        dto.leaves.forEach(it => {
            const student = this.studentsMap[it.studentId];
            student.absence = new StudentLeave(it);
        });
        this.summaryCounter.leave = dto.leaves.length;

        dto.freeListens.forEach(it => {
            const student = this.studentsMap[it.studentId];
            student.absence = new FreeListen(it);
        });
        this.summaryCounter.free = dto.freeListens.length;

        dto.cancelExams.forEach(it => {
            const student = this.studentsMap[it.studentId];
            student.absence = new CancelExam(it);
        });
        this.summaryCounter.cancel = dto.cancelExams.length;
    }

    setAttendanceStats(attendances: {[key: string]: number[]}) {
        Object.keys(attendances).forEach(studentId => {
            this.studentsMap[studentId].attendances = attendances[studentId];
        });
    }

    activateNext(step = 1): void {
        this.activeIndex += step;
        if (this.activeIndex >= this.visibleStudents.length) {
            this.activeIndex -= this.visibleStudents.length;
        }
    }

    activatePrev(step = 1): void {
        this.activeIndex -= step;
        if (this.activeIndex < 0) {
            this.activeIndex += this.visibleStudents.length;
        }
    }

    activateFirst(): void {
        this.activeIndex = 0;
    }

    activateLast(): void {
        this.activeIndex = this.visibleStudents.length - 1;
    }

    activateStudent(student: Student): void {
        this.activeIndex = this.visibleStudents.indexOf(student);
    }

    get activeStudent(): Student {
        return this.visibleStudents[this.activeIndex];
    }

    get summary(): any {
        const counters = _.countBy(this.visibleStudents, s => {
            if (s.rollcall) {
                return RollcallTypeNames[s.rollcall.type];
            } else {
                return RollcallTypeNames[RollcallType.None];
            }
        });

        return _.defaults(counters, this.summaryCounter, RollcallTypeCounts);
    }

    applySettings(): void {
        this.students.forEach(student => {
            if (student.absence instanceof CancelExam) {
                student.visible = !this.settings.hideCancel;
            } else if (student.absence instanceof FreeListen) {
                student.visible = !this.settings.hideFree;
            } else if (student.absence instanceof StudentLeave) {
                student.visible = !this.settings.hideLeave;
            }
        });

        this.hideRandom();

        this.visibleStudents = this.students.filter(s => s.visible);
        this.summaryCounter.visible = this.visibleStudents.length;
    }

    private hideRandom() {
        const random = this.settings.random;
        const normalStudents = this.students.filter(student => !student.absence);

        if (!this.randomFactors) {
            return;
        }

        if (random < 10 || random > 90) {
            normalStudents.forEach(student => student.visible = true);
            return;
        }

        // 统计迟到旷课早退次数,清除之前的随机
        const randomFactors: number[] = [];
        normalStudents.forEach((student, index) => {
            if (this.randomFactors[student.id]) {
                randomFactors[index] = this.randomFactors[student.id];
            }  else {
                randomFactors[index] = 0;
            }
            student.visible = true;
        });

        // 随机选择，统计减1，达到-1则隐藏
        const total = normalStudents.length;
        let numberToHide = (100 - random) / 100 * total;
        while (numberToHide > 0) {
            const index = Math.floor(Math.random() * total);
            if (randomFactors[index] > -1) {
                randomFactors[index]--;
                if (randomFactors[index] === -1) {
                    normalStudents[index].visible = false;
                    numberToHide--;
                }
            }
        }
    }
}
