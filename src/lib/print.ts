// Prints another page without leaving the current one: load it in a hidden iframe, wait for it
// (and its images) to finish, then open the browser's print dialog for that frame only.
// The terminal keeps its state, and any printer with a Windows driver works.

export function printPage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    frame.setAttribute('aria-hidden', 'true');

    const cleanup = () => setTimeout(() => frame.remove(), 1000);
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('The receipt took too long to load.'));
    }, 15_000);

    frame.onload = async () => {
      try {
        const doc = frame.contentDocument;
        const win = frame.contentWindow;
        if (!doc || !win) throw new Error('Could not open the print view.');
        // The server sends a "print-ready" marker; if it's missing we got an error or login page instead.
        if (!doc.querySelector('[data-print-ready]')) throw new Error('Could not load the print view. Try again.');

        await Promise.all(
          [...doc.images].map((img) =>
            img.complete ? Promise.resolve() : new Promise((done) => img.addEventListener('load', done, { once: true }))
          )
        );
        clearTimeout(timeout);
        win.addEventListener('afterprint', cleanup, { once: true });
        win.focus();
        win.print();
        resolve();
      } catch (error) {
        clearTimeout(timeout);
        cleanup();
        reject(error);
      }
    };

    frame.src = url;
    document.body.appendChild(frame);
  });
}
