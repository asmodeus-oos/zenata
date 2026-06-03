// Fix for 'write EIO' error in Node.js environments (like Electron main process)
// This error happens when console.log tries to write to a closed stdout stream.
if (typeof process !== 'undefined' && process.stdout) {
  process.stdout.on('error', (err) => {
    if (err.code === 'EIO') return;
  });
}
