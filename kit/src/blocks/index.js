import { transform2d } from './transform2d.js';
import { vectors } from './vectors.js';
import { rref } from './rref.js';
import { matmul } from './matmul.js';
import { quiz } from './quiz.js';
import { callouts, folds, card, context } from './content.js';
import { scene } from './scene.js';
import { predict } from './predict.js';
import { answer } from './answer.js';
import { conjecture } from './conjecture.js';
import { practice } from './practice.js';
import { summary } from './summary.js';
import { draft } from './draft.js';
import { array, shellsort, sortpass } from './sorting.js';
import { steps } from './steps.js';
import { recognize } from './recognize.js';
import { findbug } from './findbug.js';
import { graph, space } from './figures.js';
import { letBlock } from './letblock.js';
import { matrix } from './matrix.js';
import { sketch } from './sketch.js';
import { derive } from './derive.js';
import { image } from './image.js';
import { code } from './code.js';
import { cloze, errfind, parse, drill, chunk, link as enLink } from './english.js';
import { stepperBlock } from '../stepper.js';
import { ENGINES } from '../engines/registry.js';
import { elimEngine } from '../engines/elim.js';
import { elimDo } from './elimdo.js';
import { parseFields } from '../parse.js';
import { pvBlock } from './pvdo.js';

// 代码块语言名 → 组件
export const blocks = {
  transform2d, vectors, rref, matmul, quiz, card, ...callouts, ...folds,
  scene, predict, answer, conjecture, practice, summary, context, draft,
  array, shellsort, sortpass, steps, recognize, findbug, graph, space,
  let: letBlock, matrix, sketch, derive, image, code,
  // 英语（语法）：填空、改错、句子成分、句型操练（判分在 entext.js）
  cloze, errfind, parse, drill, chunk, link: enLink,
  // 一步步走的演示（stepper.js 外壳 + engines/ 里的纯函数引擎，名字在 engines/registry.js）
  ...Object.fromEntries(Object.entries(ENGINES).filter(([k]) => k !== 'elim' && k !== 'pv').map(([k, e]) => [k, stepperBlock(e)])),
  elim: elimBlock(),
  // 进程同步：信号量 P/V（写了 run: 是演示；没写是学生自己点进程，blocks/pvdo.js）
  pv: pvBlock(),
};

// elim：mode: do 是学生自己做行变换（blocks/elimdo.js），其余照演示组件（演示 / quiz / fill）
function elimBlock() {
  const demo = stepperBlock(elimEngine);
  const f = (el, src, opts) => (/^do$/i.test(String(parseFields(src).fields.mode ?? '').trim()) ? elimDo(el, src) : demo(el, src, opts));
  f.stepper = true;
  return f;
}
