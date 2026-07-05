using System;
using System.Collections.Generic;
using System.Drawing;
using System.Text;

namespace Moonboard;

public class Problem
{
    public string ImagePath { get; init; }
    public string Name { get; init; }
    public string SetterName { get; init; }
    public int WallAngle { get; init; }
    public Grade UserGrade { get; init; }
    public Grade SetterGrade { get; init; }
    public int StarCount { get; init; }
    public FootRules FootRules { get; init; }
    public List<Hold> StartHolds { get; init; }
    public List<Hold> IntermediateHolds { get; init; }
    public List<Hold> FinishHolds { get; init; }
}

public record Hold(int ColumnIndex, int Row)
{
    public char Column => (char)('A' + ColumnIndex);
    public string Name => Column.ToString() + (Row + 1);
}

public enum FootRules
{
    AnyMarkHolds,
    Footless,
    FootlessAndKickboard,
    NoKickboard
}