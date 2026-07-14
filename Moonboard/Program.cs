using Moonboard;
using Newtonsoft.Json;
using System.Text;

string grade = "V4";
int problemCountInGrade = 1174;

//string windowTitle = "OnePlus Nord N30 5G";
//Phone phone = new Phone(windowTitle);
////phone.TakeScreenshot("test2.png");
//new Scrapper(phone).Scrap(grade, problemCountInGrade);

//ProblemParser.TestConfig(BoardConfig.MiniMoonboard2025, "../../../Output/V3/8.png", "test3.png");

//var problems = ProblemParser.ParseFolder($"../../../Output/{grade}", BoardConfig.MiniMoonboard2025);
//string json = JsonConvert.SerializeObject(problems, Formatting.Indented);
//File.WriteAllText($"../../../Output/{grade}.json", json);
//int a = 1;

var problems = JsonConvert.DeserializeObject<List<Problem>>(File.ReadAllText($"../../../Output/{grade}.json"));
Dictionary<Hold, int> countByHold = problems
    .SelectMany(x => (Hold[])[
        ..x.StartHolds,
        ..x.IntermediateHolds,
        ..x.FinishHolds
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

string csv = sb.ToString();

string allHoldsCsv = BoardConfig.MiniMoonboard2025.GetCsvStats(problems, startHolds: true, intermediateHolds: true, finishHolds: true);
string startHolds = BoardConfig.MiniMoonboard2025.GetCsvStats(problems, startHolds: true, intermediateHolds: false, finishHolds: false);
string finishHolds = BoardConfig.MiniMoonboard2025.GetCsvStats(problems, startHolds: false, intermediateHolds: false, finishHolds: true);

int a = 0;
