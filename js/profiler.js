/*
 * Time profiler
 * @moduleName Profiler
 */
import Bento from 'bento';
import Vector2 from 'bento/math/vector2';
import Rectangle from 'bento/math/rectangle';
import Sprite from 'bento/components/sprite';
import Clickable from 'bento/components/clickable';
import Entity from 'bento/entity';
import EventSystem from 'bento/eventsystem';
import Utils from 'bento/utils';
import Tween from 'bento/tween';

var ticTime = 0;
var startTime = 0;
var totalTime = 0;
var times = {};
var totals = {};
var measures = {};
var measurements = 0;
var hasStarted = false;
var start = function () {
    hasStarted = true;
    startTime = window.performance.now();
};
var stop = function () {
    totalTime += window.performance.now() - startTime;
    measurements += 1;

    if (this.reportAfter && measurements > this.reportAfter) {
        measurements = 0;
        this.report();
    }
    hasStarted = false;
};
var report = function () {
    var key;
    console.log('== Report for time spent ==');
    console.log('Total time:', totalTime.toFixed(2) + 'ms');
    for (key in totals) {
        if (!totals.hasOwnProperty(key)) {
            continue;
        }

        console.log(
            key,
            '\n  ' + totals[key].toFixed(2) + 'ms',
            '\n  ' + (totals[key] / totalTime * 100).toFixed(0) + '%',
            '\n  ' + measures[key] + ' tics'
        );
    }
};
var tic = function (name) {
    if (!hasStarted) {
        return;
    }
    if (name) {
        times[name] = window.performance.now();
        totals[name] = totals[name] || 0;
        measures[name] = measures[name] || 0;
    } else {
        ticTime = window.performance.now();
    }
};
var toc = function (name, log) {
    if (!hasStarted) {
        return;
    }
    if (log) {
        if (name) {
            console.log(name, window.performance.now() - times[name]);
        } else {
            console.log(window.performance.now() - ticTime);
        }
    }
    totals[name] += window.performance.now() - times[name];
    measures[name] += 1;
};

export default {
    reportAfter: 10, // number of measurements to report after
    start: start,
    stop: stop,
    report: report,
    tic: tic,
    toc: toc
};
