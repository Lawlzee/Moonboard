using System;
using System.Collections.Generic;
using System.Drawing;
using System.Text;

namespace Moonboard;

public class BoardConfig
{
    public int RowCount { get; init; }
    public int ColCount { get; init; }

    public Rectangle NameRectangle { get; init; }
    public Rectangle SetterRectangle { get; init; }
    public Rectangle GradeRectangle { get; init; }
    public List<Point> StarPositions { get; init; }

    public Point A1Pixel { get; init; }
    public float PixelDistanceBetweenHolds { get; init; }

    public static BoardConfig MiniMoonboard2025 = new BoardConfig
    {
        RowCount = 12,
        ColCount = 11,
        A1Pixel = new Point(76, 776),
        NameRectangle = new Rectangle(4, 155, 420, 20),
        SetterRectangle = new Rectangle(64, 176, 320, 18),
        GradeRectangle = new Rectangle(64, 194, 320, 18),
        StarPositions = [
            new Point(182, 218),
            new Point(198, 218),
            new Point(215, 218),
            new Point(232, 218),
            new Point(248, 218),
        ],
        PixelDistanceBetweenHolds = 32.68f
    };

    public string GetCsvStats(
        List<Problem> problems, 
        bool startHolds = true,
        bool intermediateHolds = true,
        bool finishHolds = true)
    {
        Dictionary<Hold, int> countByHold = problems
            .SelectMany(x => (Hold[])[
                ..(startHolds ? x.StartHolds : []),
                ..(intermediateHolds ? x.IntermediateHolds : []),
                ..(finishHolds ? x.FinishHolds : [])
            ])
            .GroupBy(x => x)
            .ToDictionary(x => x.Key, x => x.Count());

        StringBuilder sb = new StringBuilder();
        for (int y = BoardConfig.MiniMoonboard2025.RowCount - 1; y >= 0; y--)
        {
            for (int x = 0; x < BoardConfig.MiniMoonboard2025.ColCount; x++)
            {
                Hold hold = new Hold(x, y);
                sb.Append(countByHold.TryGetValue(hold, out int value) ? value : 0);
                sb.Append("\t");
            }
            sb.AppendLine();
        }

        return sb.ToString();
    }
}
