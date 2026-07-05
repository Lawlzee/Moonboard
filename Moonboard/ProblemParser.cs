using System;
using System.Collections.Generic;
using System.Drawing;
using System.Text;
using Tesseract;

namespace Moonboard;

public class ProblemParser
{
    private static Color _starColor = Color.FromArgb(0x01EF01);
    private static Color _startColor = Color.FromArgb(0x01EF01);
    private static Color _intermediateColor = Color.FromArgb(0x005FFF);
    private static Color _finishColor = Color.FromArgb(0xF10000);
    private static float _maxColorDiff = 0.1f;

    public static List<Problem> ParseFolder(string folderPath, BoardConfig config)
    {
        var paths = Directory.GetFiles(folderPath);

        List<Problem> problems = [];
        int i = 0;
        foreach (string path in paths)
        {
            problems.Add(Parse(path, config));
            i++;
            Console.WriteLine($"{i} / {paths.Length}");

            if (i > 10)
            {
                return problems;
            }
        }

        return problems;
    }

    public static Problem Parse(string imagePath, BoardConfig config)
    {
        using Bitmap bitmap = new Bitmap(imagePath);

        List<Hold> startHolds = [];
        List<Hold> intermediateHolds = [];
        List<Hold> finishHolds = [];

        for (int x = 0; x < config.ColCount; x++)
        {
            for (int y = 0; y < config.RowCount; y++)
            {
                int pixelX = config.A1Pixel.X + x * config.PixelDistanceBetweenHolds;
                int pixelY = config.A1Pixel.Y - y * config.PixelDistanceBetweenHolds;

                Color color = bitmap.GetPixel(pixelX, pixelY);
                float hue = color.GetHue();

                if (IsSameColor(_startColor, color))
                {
                    startHolds.Add(new Hold(x, y));
                }
                else if (IsSameColor(_intermediateColor, color))
                {
                    intermediateHolds.Add(new Hold(x, y));
                }
                else if (IsSameColor(_finishColor, color))
                {
                    finishHolds.Add(new Hold(x, y));
                }
            }
        }

        int starCount = 0;
        foreach (Point point in config.StarPositions)
        {
            Color color = bitmap.GetPixel(point.X, point.Y);
            if (IsSameColor(_starColor, color))
            {
                starCount++;
            }
        }

        return new Problem
        {
            ImagePath = imagePath,
            Name = ParseText(bitmap, config.NameRectangle),
            SetterName = ParseText(bitmap, config.SetterRectangle),
            WallAngle = 40,
            UserGrade = Grade.V3,
            SetterGrade = Grade.V3,
            StarCount = starCount,
            FootRules = FootRules.AnyMarkHolds,
            StartHolds = startHolds,
            IntermediateHolds = intermediateHolds,
            FinishHolds = finishHolds,
        };
    }

    private static string ParseText(Bitmap bitmap, Rectangle region)
    {
        using Bitmap cropped = bitmap.Clone(region, bitmap.PixelFormat);

        using var engine = new TesseractEngine(@"./tessdata", "eng", EngineMode.Default);
        using var img = PixConverter.ToPix(cropped);
        using var page = engine.Process(img);

        return page.GetText();
    }

    private static bool IsSameColor(Color a, Color b)
    {
        const double maxDistance = 441.67d;

        int dr = a.R - b.R;
        int dg = a.G - b.G;
        int db = a.B - b.B;

        double distance = Math.Sqrt(dr * dr + dg * dg + db * db);
        return distance < _maxColorDiff * maxDistance;
    }
}
