using Moonboard;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

string grade = "V3";
int problemCountInGrade = 1174;

//string windowTitle = "OnePlus Nord N30 5G";
//Phone phone = new Phone(windowTitle);
////phone.TakeScreenshot("test2.png");
//new Scrapper(phone).Scrap(grade, problemCountInGrade);

ProblemParser.TestConfig(BoardConfig.MiniMoonboard2025, "../../../Output/V3/8.png", "test3.png");

var problems = ProblemParser.ParseFolder($"../../../Output/{grade}", BoardConfig.MiniMoonboard2025);
string json = JsonConvert.SerializeObject(problems, Formatting.Indented, new JsonSerializerSettings { Converters = { new StringEnumConverter() }});
File.WriteAllText($"../../../Output/{grade}.json", json);

//var problems = JsonConvert.DeserializeObject<List<Problem>>(File.ReadAllText($"../../../Output/{grade}.json"));
//
//string allHoldsCsv = BoardConfig.MiniMoonboard2025.GetCsvStats(problems, startHolds: true, intermediateHolds: true, finishHolds: true);
//string startHolds = BoardConfig.MiniMoonboard2025.GetCsvStats(problems, startHolds: true, intermediateHolds: false, finishHolds: false);
//string finishHolds = BoardConfig.MiniMoonboard2025.GetCsvStats(problems, startHolds: false, intermediateHolds: false, finishHolds: true);

int a = 0;
