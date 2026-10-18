/**
 * Regenerates the educator-packet screenshots of the draft make-ten lab
 * (docs/cricket-lab-screens). Not a test and not run in CI.
 *
 *   npm run build && npm start -- --port 3100
 *   LAB_BASE=http://localhost:3100 node tests/tools/capture-lab-screens.mjs
 *
 * It plays the lesson with the learner's right answers, plus one deliberate
 * wrong answer per question, so every mathematical state is captured exactly as
 * rendered. Nothing is sent anywhere: the lab never calls the server.
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.LAB_BASE ?? "http://localhost:3100";
const OUT = new URL("../../docs/cricket-lab-screens/", import.meta.url)
  .pathname;
mkdirSync(OUT, { recursive: true });

const ball = (p, n) => p.locator(`button[data-lab-ball="${n}"]`);
const answer = async (p, n) => {
  await p
    .getByRole("radio", { name: String(n), exact: true })
    .check({ force: true });
  await p.getByRole("button", { name: "Check", exact: true }).click();
};
const next = (p) => p.getByRole("button", { name: "Next step" });

async function run(width, height, tag, states) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(`${BASE}/cricket/make-ten-lab`);
  const shot = async (name) => {
    // Let travel and reveal animations finish so the picture is the settled state.
    await page.waitForTimeout(700);
    if (states.includes(name))
      await page.screenshot({ path: `${OUT}${tag}-${name}.png` });
  };
  await shot("1a-start");
  for (let n = 1; n <= 5; n++) await ball(page, n).click();
  await shot("1b-five-in-rack");
  for (let n = 6; n <= 10; n++) await ball(page, n).click();
  await shot("1c-ten-question");
  await answer(page, 10);
  await shot("1d-feedback-ten");
  await ball(page, 11).click();
  await shot("1d2-marked-outside");
  await answer(page, 3);
  await shot("1e-right");
  await next(page).click();
  await shot("2a-nets-arrive");
  for (const n of [11, 12, 13]) await ball(page, n).click();
  await shot("2b-extras-sent-question");
  await answer(page, 5);
  await shot("2c-feedback-five");
  await answer(page, 2);
  await shot("2d-right");
  await next(page).click();
  await shot("3a-take-from-ten");
  await ball(page, 1).click();
  await shot("3b-one-from-ten");
  await ball(page, 2).click();
  await shot("3c-three-and-two");
  await next(page).click();
  await shot("4a-question");
  for (const n of [3, 4, 5]) await ball(page, n).click();
  await shot("4b-marked");
  await answer(page, 5);
  await shot("4c-feedback-five");
  await answer(page, 8);
  await shot("4d-recap");
  await next(page).click();
  await shot("5a-unguided-start");
  for (let n = 1; n <= 4; n++) await ball(page, n).click();
  await shot("5b-unguided-question");
  await answer(page, 4);
  await shot("5c-unguided-feedback");
  await answer(page, 7);
  await shot("5d-unguided-right");
  await browser.close();
}

const all = [
  "1a-start",
  "1b-five-in-rack",
  "1c-ten-question",
  "1d-feedback-ten",
  "1d2-marked-outside",
  "1e-right",
  "2a-nets-arrive",
  "2b-extras-sent-question",
  "2c-feedback-five",
  "2d-right",
  "3a-take-from-ten",
  "3b-one-from-ten",
  "3c-three-and-two",
  "4a-question",
  "4b-marked",
  "4c-feedback-five",
  "4d-recap",
  "5a-unguided-start",
  "5b-unguided-question",
  "5c-unguided-feedback",
  "5d-unguided-right",
];
// Every state on a phone; the question states on the smallest phone; the key states on a desktop.
await run(390, 844, "m390", all);
await run(320, 568, "m320", [
  "1c-ten-question",
  "2b-extras-sent-question",
  "4a-question",
  "5b-unguided-question",
]);
await run(1440, 900, "d1440", [
  "1c-ten-question",
  "2d-right",
  "3c-three-and-two",
  "4d-recap",
  "5b-unguided-question",
]);
console.log("done", OUT);
