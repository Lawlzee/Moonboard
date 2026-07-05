using Moonboard;

string windowTitle = "OnePlus Nord N30 5G";
Phone phone = new Phone(windowTitle);
new Scrapper(phone).Scrap("V3", 818);