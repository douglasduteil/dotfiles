# HDMI capture card: viewing another computer's screen from a WSL2 machine

## Open it from Windows, not WSL2 (ffmpeg 9.0.2, MS2109 adapter, 2026-11-17)

A USB HDMI capture adapter (UGREEN and other MS2109-based ones, USB ID
`534D:2109`) is a plain UVC webcam named `USB Video`. The stock WSL2 kernel
has no `uvcvideo` driver, so `usbipd attach` does not give you a `/dev/video*`.
Run the viewer on Windows instead. ffmpeg isn't installed there by default:
`winget install --id Gyan.FFmpeg -e`.

    ffmpeg -hide_banner -list_devices true -f dshow -i dummy
    ffplay -f dshow -vcodec mjpeg -video_size 1920x1080 -framerate 30 -rtbufsize 100M -i video="USB Video"

- `-vcodec mjpeg` is required. Uncompressed YUYV over USB 2 tops out at
  5 fps at 1080p and 30 fps only at 720x480 or below
  (`-f dshow -list_options true -i video="USB Video"`).
- The device advertises MJPEG 1080p60, but at 60 fps the decoder logs
  "No JPEG data found in image" errors. 30 fps decodes without errors.
- Colour bars mean the capture path works but no HDMI signal is arriving.
  Wake the source computer and check that its display output is enabled.
- From a WSL shell, run the binaries through `powershell.exe`. The winget
  aliases in `%LOCALAPPDATA%\Microsoft\WinGet\Links` do not resolve until a
  new shell starts after the install.
