export interface MoonboardProblem {
    ImagePath: string;
    Name: string;
    SetterName: string;
    WallAngle: number;
    UserGrade: string;
    SetterGrade: string;
    StarCount: number;
    FootRules: string;
    StartHolds: string[];
    IntermediateHolds: string[];
    FinishHolds: string[];
}

export type FootRules = "AnyMarkHolds"
    | "Footless"
    | "FootlessAndKickboard"
    | "NoKickboard"