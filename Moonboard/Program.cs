using Moonboard;
using Newtonsoft.Json;

//string windowTitle = "OnePlus Nord N30 5G";
//Phone phone = new Phone(windowTitle);
//phone.TakeScreenshot("test2.png");
//new Scrapper(phone).Scrap("V3", 818);

ProblemParser.TestConfig(BoardConfig.MiniMoonboard2025, "../../../Output/V3/8.png", "test3.png");

var problems = ProblemParser.ParseFolder("../../../Output/V3", BoardConfig.MiniMoonboard2025);
string json = JsonConvert.SerializeObject(problems, Formatting.Indented);
File.WriteAllText("../../../Output/V3.json", json);
//int a = 1;