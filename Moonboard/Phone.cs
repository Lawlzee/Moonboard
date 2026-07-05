using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;

namespace Moonboard;

public class Phone
{
    private readonly IntPtr _handle;
    private string _lastHash;
    private int _duplicateHash;

    public Phone(string windowTitle)
    {
        _handle = FindWindow(null, windowTitle);

        if (_handle == IntPtr.Zero)
        {
            throw new Exception("Window not found.");
        }
    }

    public void Focus()
    {
        SetForegroundWindow(_handle);
        Thread.Sleep(200);
    }

    public void TakeScreenshot(string outputPath)
    {
        if (!GetWindowRect(_handle, out RECT rect))
        {
            throw new Exception("Failed to get window bounds.");
        }

        int width = rect.Right - rect.Left;
        int height = rect.Bottom - rect.Top;

        using Bitmap bmp = new Bitmap(width, height);
        using Graphics g = Graphics.FromImage(bmp);

        g.CopyFromScreen(
            rect.Left,
            rect.Top,
            0,
            0,
            new Size(width, height));


        bmp.Save(outputPath, ImageFormat.Png);
        Console.WriteLine(outputPath + " saved");

        /*
        string hash = GetHash(bmp);
        if (hash == _lastHash)
        {
            Console.WriteLine(outputPath + " skiped because it has the same hash " + hash);
            _duplicateHash++;
        }
        else
        {
            bmp.Save(outputPath, ImageFormat.Png);
            Console.WriteLine(outputPath + " saved with hash " + hash);
            _lastHash = hash;
            _duplicateHash = 0;
        }

        return _duplicateHash;*/
    }

    private static string GetHash(Bitmap bmp)
    {
        var rect = new Rectangle(0, 0, bmp.Width, bmp.Height);

        var data = bmp.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);

        try
        {
            int length = Math.Abs(data.Stride) * bmp.Height;
            byte[] bytes = new byte[length];

            Marshal.Copy(data.Scan0, bytes, 0, length);

            using SHA256 sha = SHA256.Create();
            byte[] hash = sha.ComputeHash(bytes);

            return Convert.ToHexString(hash);
        }
        finally
        {
            bmp.UnlockBits(data);
        }
    }


    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    static extern IntPtr FindWindow(string? lpClassName, string? lpWindowName);

    [DllImport("user32.dll")]
    static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [StructLayout(LayoutKind.Sequential)]
    struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    public void SwipeRight()
    {
        //SetForegroundWindow(_handle);
        //Thread.Sleep(200);

        if (!GetWindowRect(_handle, out RECT rect))
        {
            throw new Exception("Failed to get window bounds.");
        }

        // Swipe in the middle of the window
        int startX = rect.Left + (int)((rect.Right - rect.Left) * 0.8);
        int endX = rect.Left + (int)((rect.Right - rect.Left) * 0.2);
        int y = rect.Top + (rect.Bottom - rect.Top) / 2;

        MoveMouse(startX, y);
        Thread.Sleep(20);

        MouseDown();

        const int steps = 30;

        for (int i = 1; i <= steps; i++)
        {
            int x = startX + (endX - startX) * i / steps;
            MoveMouse(x, y);
            Thread.Sleep(8);
        }

        MouseUp();

        MoveMouse(0, 0);
    }

    static void MoveMouse(int x, int y)
    {
        INPUT input = new INPUT
        {
            type = INPUT_MOUSE,
            U = new InputUnion
            {
                mi = new MOUSEINPUT
                {
                    dx = x * 65535 / GetSystemMetrics(0),
                    dy = y * 65535 / GetSystemMetrics(1),
                    dwFlags = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE
                }
            }
        };

        SendInput(1, new[] { input }, Marshal.SizeOf<INPUT>());
    }

    static void MouseDown()
    {
        SendMouse(MOUSEEVENTF_LEFTDOWN);
    }

    static void MouseUp()
    {
        SendMouse(MOUSEEVENTF_LEFTUP);
    }

    static void SendMouse(uint flags)
    {
        INPUT input = new INPUT
        {
            type = INPUT_MOUSE,
            U = new InputUnion
            {
                mi = new MOUSEINPUT
                {
                    dwFlags = flags
                }
            }
        };

        SendInput(1, new[] { input }, Marshal.SizeOf<INPUT>());
    }

    const int INPUT_MOUSE = 0;

    const uint MOUSEEVENTF_MOVE = 0x0001;
    const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    const uint MOUSEEVENTF_LEFTUP = 0x0004;
    const uint MOUSEEVENTF_ABSOLUTE = 0x8000;

    [DllImport("user32.dll")]
    static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

    [DllImport("user32.dll")]
    static extern bool SetForegroundWindow(IntPtr hWnd);


    [DllImport("user32.dll")]
    static extern int GetSystemMetrics(int nIndex);


    [StructLayout(LayoutKind.Sequential)]
    struct INPUT
    {
        public int type;
        public InputUnion U;
    }

    [StructLayout(LayoutKind.Explicit)]
    struct InputUnion
    {
        [FieldOffset(0)]
        public MOUSEINPUT mi;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct MOUSEINPUT
    {
        public int dx;
        public int dy;
        public uint mouseData;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }
}
