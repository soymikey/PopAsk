interface Window {
  go: {
    main: {
      ScreenshotService: {
        CaptureScreen(): Promise<string>;
      };
    };
  };
}
