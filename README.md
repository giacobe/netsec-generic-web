# Generic NetSec web platform

Reusable static v86 exercise shell with one to five named computer tabs, graphical and serial interfaces, retained guest state, isolated Ethernet, mouse capture, boot progress, instructions, and light/dark themes. The example has Web Client (10.0.0.20) and Web Server (10.0.0.10).

## Run or deploy

Place these separately built/distributed files in `netsec/web/images/`:

- client-bzImage
- client-rootfs.cpio.gz
- server-bzImage
- server-rootfs.cpio.gz

VM images are deliberately excluded from Git, including kernel and initramfs files. There is no image download service configured yet. Build them using the linked repositories, or copy the tested image files distributed by the instructor. Verify SHA256SUMS before installing them.

Serve the repository through HTTP, e.g. `python3 -m http.server 8081`, then open http://localhost:8081/netsec/web/. On a static web server upload the entire `netsec` directory, preserving the hierarchy. Directories need mode 755; public files need 644. Nested paths such as /netsec/web/ are supported. Loading requires WebAssembly; guest mouse capture depends on browser Pointer Lock support. Escape releases capture.

## Build repositories

- https://github.com/giacobe/buildroot-builder-netsec — separate 01/02/03 workflow
- https://github.com/giacobe/netsec-generic-web-client — NetSurf/X.org/Matchbox client configuration and overlay
- https://github.com/giacobe/netsec-generic-web-server — Python/SQLite server configuration and overlay

Customize `netsec/web/index.html` using the `computers` array (one to five entries). Labels describe function, e.g. Web Client, Web Server, Certification Authority. Use `display: "graphical"` for VGA interfaces or `display: "serial"` for console-only guests. For other OS images supply disk/ISO boot options through `v86Options`; the OS must support the selected interface. All guests remain running and share a private Ethernet segment. The interface does not create a network gateway.

## Checks

`node netsec/web/tests/runtime.test.cjs`
`node netsec/web/tests/boot-status.test.cjs`
`node netsec/web/tests/computers.test.cjs`

## Third-party assets

Bundled v86 runtime/BIOS and xterm assets retain their original licenses; see THIRD_PARTY.md and licenses/. Fonts, marked, and DOMPurify currently load from external CDNs. No VM images or Buildroot downloads are included.
