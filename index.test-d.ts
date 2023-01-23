import {expectType} from 'tsd';
import wrapAnsi from './index.js';

expectType<string>(wrapAnsi('input', 80));
expectType<string>(wrapAnsi('input', 80, {}));
expectType<string>(wrapAnsi('input', 80, {hard: true}));
expectType<string>(wrapAnsi('input', 80, {hard: false}));
expectType<string>(wrapAnsi('input', 80, {trim: true}));
expectType<string>(wrapAnsi('input', 80, {trim: false}));
expectType<string>(wrapAnsi('input', 80, {wordWrap: true}));
expectType<string>(wrapAnsi('input', 80, {wordWrap: false}));
