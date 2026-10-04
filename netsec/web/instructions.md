# Web client and server

## Choose a computer

Use **Web Client** and **Web Server** above the computer display to switch
between computers. Both remain running, and your work stays in place.
Press **Escape** to release the captured mouse before selecting another tab.
The server provides a terminal: log in as `root` with no password.

## Open the application

Follow the startup overlay while the images and desktop load. It disappears
when the application opens. Startup may take about two minutes; no login is
required. The application is at `http://10.0.0.10/` inside the workstation.

Enter a short message and submit the form. Your message should appear in the
history. Reload the page: the saved message and your session should remain.
Click the guest desktop to capture the mouse, then click the message
field, type, and click **Save message**. Press **Escape** to release the mouse
and use the lab controls again. **Capture mouse** is available as a fallback.
Keyboard navigation uses Tab and Shift+Tab;
Ctrl+R reloads the guest page.

The client uses NetSurf with desktop browser controls. This lab uses ordinary
HTML forms; NetSurf's JavaScript support is limited.

## Examine connectivity

The graphical browser starts automatically. Select **Terminal** for the
workstation's serial console; it opens a root shell automatically. Run:

```sh
ip addr show eth0
curl -i http://10.0.0.10/health
curl -i -c /tmp/cookies http://10.0.0.10/
curl -i -b /tmp/cookies -d 'message=Hello+from+curl' http://10.0.0.10/messages
```

The health endpoint should return HTTP 200 and `ready`. Submitting the form
should return HTTP 303; loading the home page shows the stored message.

Select **Desktop** to return to the graphical browser.

## Reset

**Reset Lab** restarts both guests. Messages and cookies are disposable and
the database returns to its initial state. This network exists only in this
browser tab; the workstation and server have no internet gateway.
