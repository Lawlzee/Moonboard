using Moonboard;

string windowTitle = "OnePlus Nord N30 5G";
string outputPath = "../../../Output";

Phone phone = new Phone(windowTitle);
phone.Focus();

for (int i = 0; i < 1000; i++)
{
    if (Keyboard.IsF12Down())
    {
        return;
    }

    /*int duplicateHashCount = phone.TakeScreenshot(Path.Combine(outputPath, i + ".png"));

    if (duplicateHashCount > 9)
    {
        return;
    }*/

    phone.TakeScreenshot(Path.Combine(outputPath, i + ".png"));
    phone.SwipeRight();
    Thread.Sleep(200);
}