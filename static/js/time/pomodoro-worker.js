let timer;
let remainingTime;

self.onmessage = function (e) {
    const { action, time } = e.data;

    if (action === 'start') {
        remainingTime = time;
        timer = setInterval(() => {
            remainingTime--;
            self.postMessage({ type: 'tick', time: remainingTime });

            if (remainingTime <= 0) {
                clearInterval(timer);
                self.postMessage({ type: 'complete' });
            }
        }, 1000);
    } else if (action === 'pause') {
        clearInterval(timer);
    } else if (action === 'reset') {
        clearInterval(timer);
        remainingTime = time;
        self.postMessage({ type: 'tick', time: remainingTime });
    }
}; 