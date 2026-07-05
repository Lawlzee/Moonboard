using System.Runtime.InteropServices;

namespace Moonboard;

public static class Keyboard
{
    [DllImport("user32.dll")]
    private static extern short GetAsyncKeyState(int vKey);

    private const int VK_F12 = 0x7B;

    public static bool IsF12Down()
    {
        return (GetAsyncKeyState(VK_F12) & 0x8000) != 0;
    }
}