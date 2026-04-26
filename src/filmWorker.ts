import { processImage } from './filmProcessor';
import type { FilmPreset } from './filmPresets';
import type { ProcessingParams } from './filmProcessor';

type FilmWorkerPayload = {
  imageData: {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  };
  preset: FilmPreset;
  params: ProcessingParams;
  grainSeed?: number;
};

type FilmWorkerRequest = {
  id: number;
  type: 'process';
  payload: FilmWorkerPayload;
};

type FilmWorkerResponse =
  | { id: number; success: true; result: { width: number; height: number; data: ArrayBuffer } }
  | { id: number; success: false; error: string };

self.addEventListener('message', async (event: MessageEvent<FilmWorkerRequest>) => {
  const { id, type, payload } = event.data;

  if (type !== 'process') {
    const response: FilmWorkerResponse = { id, success: false, error: 'Unknown worker message type' };
    self.postMessage(response);
    return;
  }

  try {
    const source = new ImageData(
      new Uint8ClampedArray(payload.imageData.data),
      payload.imageData.width,
      payload.imageData.height,
    );

    const result = processImage(source, payload.preset, payload.params, payload.grainSeed);
    const response: FilmWorkerResponse = {
      id,
      success: true,
      result: {
        width: result.width,
        height: result.height,
        data: result.data.buffer,
      },
    };

    self.postMessage(response, [result.data.buffer]);
  } catch (error) {
    const response: FilmWorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
});
