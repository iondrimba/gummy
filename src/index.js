import App from './scripts/app';

try {
  new App().init();

  if (module.hot) {
    module.hot.accept('./scripts/app', () => {
      new App().init();
    });
  }
} catch (error) {
  console.log(error);
}
