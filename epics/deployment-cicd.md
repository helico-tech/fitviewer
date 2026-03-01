# Epic: Deployment & CI/CD

Configure production builds and automated deployment to GitHub Pages.

## Story: Configure Vite production build
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Implement tab navigation layout

#### Tasks
- [ ] Set `base: '/fitviewer/'` in `vite.config.ts` for GitHub Pages
- [ ] Configure optimized chunks with code splitting
- [ ] Ensure Web Worker is bundled correctly
- [ ] Verify `npm run build` succeeds and `dist/` is self-contained
- [ ] Verify `npm run preview` works correctly

#### Acceptance Criteria
- `vite.config.ts` sets `base: '/fitviewer/'` for GitHub Pages
- Build produces optimized chunks with code splitting
- Web Worker is bundled correctly
- `npm run build` succeeds and `dist/` folder is self-contained
- Preview with `npm run preview` works correctly

## Story: Set up GitHub Actions CI/CD
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Configure Vite production build, End-to-end UI testing with Playwright

#### Tasks
- [ ] Create `.github/workflows/deploy.yml` triggered on push to `main`
- [ ] Add workflow steps: install dependencies, run Playwright tests, build, deploy to gh-pages
- [ ] Use `peaceiris/actions-gh-pages` for deployment
- [ ] Configure Playwright headless mode in CI
- [ ] Deploy build artifacts to `gh-pages` branch

#### Acceptance Criteria
- `.github/workflows/deploy.yml` workflow triggers on push to `main`
- Workflow steps: install dependencies, run Playwright tests, build, deploy to gh-pages
- Uses `peaceiris/actions-gh-pages` for deployment
- Playwright runs in headless mode in CI
- Build artifacts are deployed to the `gh-pages` branch
