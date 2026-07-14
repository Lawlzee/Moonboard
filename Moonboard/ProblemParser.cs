using System;
using System.Collections.Generic;
using System.Drawing;
using System.Text;
using System.Text.RegularExpressions;
using Tesseract;

namespace Moonboard;

public static class ProblemParser
{
    private static Color _starColor = Color.FromArgb(0xFFB821);
    private static Color _startColor = Color.FromArgb(0x01EF01);
    private static Color _intermediateColor = Color.FromArgb(0x005FFF);
    private static Color _finishColor = Color.FromArgb(0xF10000);
    private static float _maxColorDiff = 0.1f;

    public static List<Problem> ParseFolder(string folderPath, BoardConfig config)
    {
        var paths = Directory.GetFiles(folderPath);

        List<Problem> problems = [];
        int i = 0;
        foreach (string path in paths.OrderBy(x => int.Parse(Path.GetFileNameWithoutExtension(x))))
        {
            problems.Add(Parse(path, config));
            i++;
            Console.WriteLine($"{i} / {paths.Length}");

            //if (i > 10)
            //{
            //    return problems;
            //}
        }

        return problems;
    }

    public static Problem Parse(string imagePath, BoardConfig config)
    {
        using Bitmap bitmap = new Bitmap(imagePath);

        List<Hold> startHolds = [];
        List<Hold> intermediateHolds = [];
        List<Hold> finishHolds = [];

        for (int y = 0; y < config.RowCount; y++)
        {
            for (int x = 0; x < config.ColCount; x++)
            {
                int pixelX = (int)Math.Round(config.A1Pixel.X + x * config.PixelDistanceBetweenHolds);
                int pixelY = (int)Math.Round(config.A1Pixel.Y - y * config.PixelDistanceBetweenHolds);

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

        (Grade userGrade, Grade setterGrade) = ParseGrade(bitmap, config.GradeRectangle);

        return new Problem
        {
            ImagePath = imagePath,
            Name = ParseProblemName(bitmap, config.NameRectangle),
            SetterName = ParseSetterName(bitmap, config.SetterRectangle),
            WallAngle = 40,
            UserGrade = userGrade,
            SetterGrade = setterGrade,
            StarCount = starCount,
            FootRules = FootRules.AnyMarkHolds,
            StartHolds = startHolds,
            IntermediateHolds = intermediateHolds,
            FinishHolds = finishHolds,
        };
    }

    private static string ParseProblemName(Bitmap bitmap, Rectangle region)
    {
        string rawName = ParseText(bitmap, region);

        string regex = @"\s*[\@\©O]?\s*(\\n)?\s*$";
        return Regex.Replace(rawName, regex, "").Trim();
    }

    private static string ParseSetterName(Bitmap bitmap, Rectangle region)
    {
        string rawName = ParseText(bitmap, region);

        var match = Regex.Match(rawName, "Set by (.*) @");
        if (match.Success)
        {
            return match.Groups[1].Value;
        }

        return rawName;
    }

    private static (Grade UserGrade, Grade SetterGrade) ParseGrade(Bitmap bitmap, Rectangle region)
    {
        string rawGrade = ParseText(bitmap, region);

        Grade userGrade = Grade.Unknown;
        var userMatch = Regex.Match(rawGrade, @"User (\d[A-C]\+?)/V\d{1,2}", RegexOptions.IgnoreCase);
        if (userMatch.Success)
        {
            string gradeText = userMatch.Groups[1].Value;
            if (Enum.TryParse("_" + gradeText.Replace("+", "P"), out Grade grade))
            {
                userGrade = grade;
            }
        }

        Grade setterGrade = Grade.Unknown;
        var setterMatch = Regex.Match(rawGrade, @"Setter (\d[A-C]\+?)/V\d{1,2}", RegexOptions.IgnoreCase);
        if (setterMatch.Success)
        {
            string gradeText = setterMatch.Groups[1].Value;
            if (Enum.TryParse("_" + gradeText.Replace("+", "P"), out Grade grade))
            {
                setterGrade = grade;
            }
        }

        return (userGrade, setterGrade);
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

    public static void TestConfig(BoardConfig config, string inputPath, string outputPath)
    {
        using Bitmap bitmap = new Bitmap(inputPath);

        List<Hold> startHolds = [];
        List<Hold> intermediateHolds = [];
        List<Hold> finishHolds = [];

        for (int y = 0; y < config.RowCount; y++)
        {
            for (int x = 0; x < config.ColCount; x++)
            {
                int pixelX = (int)Math.Round(config.A1Pixel.X + x * config.PixelDistanceBetweenHolds);
                int pixelY = (int)Math.Round(config.A1Pixel.Y - y * config.PixelDistanceBetweenHolds);

                bitmap.SetPixel(pixelX, pixelY, Color.DarkOrange);
            }
        }

        int starCount = 0;
        foreach (Point point in config.StarPositions)
        {
            bitmap.SetPixel(point.X, point.Y, Color.DarkOrange);
        }

        for (int x = config.NameRectangle.Left; x < config.NameRectangle.Right; x++)
        {
            for (int y = config.NameRectangle.Top; y < config.NameRectangle.Bottom; y++)
            {
                bitmap.SetPixel(x, y, Color.DarkOrange);
            }
        }

        for (int x = config.SetterRectangle.Left; x < config.SetterRectangle.Right; x++)
        {
            for (int y = config.SetterRectangle.Top; y < config.SetterRectangle.Bottom; y++)
            {
                bitmap.SetPixel(x, y, Color.DarkOrange);
            }
        }

        for (int x = config.GradeRectangle.Left; x < config.GradeRectangle.Right; x++)
        {
            for (int y = config.GradeRectangle.Top; y < config.GradeRectangle.Bottom; y++)
            {
                bitmap.SetPixel(x, y, Color.Red);
            }
        }

        bitmap.Save(outputPath);
    }
}
