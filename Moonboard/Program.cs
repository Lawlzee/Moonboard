using Moonboard;

//string windowTitle = "OnePlus Nord N30 5G";
//Phone phone = new Phone(windowTitle);
//phone.TakeScreenshot("test.png");
//new Scrapper(phone).Scrap("V3", 818);

var problems = ProblemParser.ParseFolder("../../../Output/V3", BoardConfig.MiniMoonboard2025);
int a = 1;