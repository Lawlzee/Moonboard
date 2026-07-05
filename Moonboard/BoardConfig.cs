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
    public int PixelDistanceBetweenHolds { get; init; }

    public static BoardConfig MiniMoonboard2025 = new BoardConfig
    {
        RowCount = 12,
        ColCount = 11,
        A1Pixel = new Point(76, 775),
        NameRectangle = new Rectangle(4, 155, 420, 20),
        SetterRectangle = new Rectangle(64, 176, 320, 20),
        GradeRectangle = new Rectangle(84, 176, 320, 20),
        StarPositions = [
            new Point(182, 218),
            new Point(198, 218),
            new Point(215, 218),
            new Point(232, 218),
            new Point(248, 218),
        ],
        PixelDistanceBetweenHolds = 33
    };
}
