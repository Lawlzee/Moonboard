using System;
using System.Collections.Generic;
using System.Text;

namespace Moonboard;

public class Scrapper
{
    private readonly Phone _phone;

    public Scrapper(Phone phone)
    {
        _phone = phone;
    }

    public void Scrap(string grade, int problemCount)
    {
        string outputPath = Path.Combine( "../../../Output", grade);

        _phone.Focus();

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

            _phone.TakeScreenshot(Path.Combine(outputPath, i + ".png"));
            _phone.SwipeRight();
            Thread.Sleep(200);
        }
    }
}
