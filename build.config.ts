import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/index', 'src/cli', 'test'],
  clean: true,
  declaration: true,
  rollup: {
    inlineDependencies: true,
  },
});
