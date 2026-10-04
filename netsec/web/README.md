# Generic web exercise

See the repository README for setup and image builders.

## Computer tabs

Configure an ordered `computers` array in `web/index.html` with one to five entries. Each entry has a functional `label`, optional `badge`, `memoryMiB`, and `display` (`graphical` or `serial`). Linux guests use `bzimage` and `initrd`. Other boot media can be supplied through `v86Options`, for example `{hda: {url: "./images/disk.img"}}`, without a Linux kernel. The guest image must support the chosen desktop or serial interface; the tabs do not install an OS or desktop.

For a PKI lab, label the entries **Web Client**, **Web Server**, and **Certification Authority** (or **CA**). Every computer boots once, remains running while hidden, and joins the same private Ethernet network. Allocate unique addresses in the guest images. Each computer retains its desktop/terminal selection and console history. Mouse capture is released when changing computers; only the selected graphical computer receives native keyboard and mouse input. Arrow keys, Home, and End navigate the computer tabs. Memory requirements add across all running guests.

The older `visibleVm` / `hiddenVms` configuration remains supported for existing exercises.
