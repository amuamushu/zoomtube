// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import TimestampUtil from '../../timestamp-util.js';

const CUSTOM_ELEMENT_TRANSCRIPT_LINE = 'transcript-line';

/**
 * Sends a POST request to delete all of the transcript lines from datastore.
 */
export function deleteTranscript() {
  fetch('/delete-transcript', {method: 'POST'});
}

/**
 * Creates a transcript line element containing the text,
 * start time, and end time.
 */
export class TranscriptLineElement extends HTMLElement {
  static #DEFAULT_FONT_WEIGHT = 'text-muted';
  static #BOLD_FONT_WEIGHT = 'font-weight-bold';
  // Shifts the time to seek such that the seeked time is within
  // the transcript line's time range.
  static #SEEK_TIME_OFFSET_MS = 1;

  #timestampElement;
  static #COMMENT_INDICATOR_CLASSES = 'indicator badge badge-pill';
  static #COMMENT_INDICATOR_POPOVER_MESSAGE =
      'The number of comments at this transcript line';

  commentIndicator;

  /**
   * Creates a custom HTML element representing `transcriptLine` with
   * the text and time range appended to the element.
   *
   * @param transcriptLine The transcriptLine from `ENDPOINT_TRANSCRIPT`
   *     whose `attributes` should be used.
   */
  static createTranscriptLineElement(transcriptLine) {
    const timestampRange = TimestampUtil.timestampRangeToString(
        transcriptLine.startTimestampMs, transcriptLine.endTimestampMs);
    return new TranscriptLineElement(timestampRange, transcriptLine);
  }

  /**
   * Creates a custom HTML element representing `transcriptLine`.
   *
   * @param timestampRange The timestamp for the transcript line.
   * @param transcriptLine The transcriptLine from `ENDPOINT_TRANSCRIPT`
   *     whose `attributes` should be used.
   */
  constructor(timestampRange, transcriptLine) {
    super();
    const contentDivElement = TranscriptLineElement.createContentDivElement();
    this.#timestampElement =
        TranscriptLineElement.createParagraphWithClasses(timestampRange, [
          'justify-content-start',
          'mb-1',
          'transcript-line-timestamp',
        ]);
    contentDivElement.appendChild(this.#timestampElement);
    TranscriptLineElement.appendParagraphToContainer(
        transcriptLine.content, contentDivElement, ['ml-4', 'mb-1']);
    this.commentIndicator = TranscriptLineElement.createCommentIndicator();
    contentDivElement.appendChild(this.commentIndicator);
    this.classList.add(
        'align-self-center', 'mb-2',
        TranscriptLineElement.#DEFAULT_FONT_WEIGHT);
    this.appendChild(contentDivElement);
    this.appendChild(TranscriptLineElement.createHrElement());
    this.transcriptLine = transcriptLine;
  }

  /**
   * Attaches an event listener such that every time the timestamp is
   * clicked on, the timestamp's starting time is broadcasted to the
   * other event listeners subscribed to seeking.
   */
  attachSeekingEventListener(eventController) {
    this.#timestampElement.onclick = eventController.broadcastEvent.bind(
        eventController, 'seekAll',
        this.transcriptLine.startTimestampMs +
            TranscriptLineElement.#SEEK_TIME_OFFSET_MS);
  }

  /**
   * Creates a stylized div element that will be used to store
   * the time range and text in a `TranscriptLineElement`.
   */
  static createContentDivElement() {
    const contentDivElement = document.createElement('div');
    contentDivElement.classList.add('d-flex', 'flex-row', 'mb-1');
    return contentDivElement;
  }

  /**
   * Creates a stylized hr element that will be used to create a
   * `TranscriptLineElement`.
   */
  static createHrElement() {
    const hrElement = document.createElement('hr');
    hrElement.classList.add('my-1', 'align-middle');
    return hrElement;
  }

  /**
   * Creates an invisible stylized comment indicator element
   * with a popover.
   *
   * <p>Once the element is populated then it becomes visible.
   */
  static createCommentIndicator() {
    const commentIndicator = document.createElement('span');
    commentIndicator.className =
        TranscriptLineElement.#COMMENT_INDICATOR_CLASSES;
    commentIndicator.innerText = 0;
    TranscriptLineElement.addPopoverToCommentIndicator(commentIndicator);
    return commentIndicator;
  }

  /**
   * Adds a popover to `commentIndicator` that will appear upon
   * hovering over it.
   */
  static addPopoverToCommentIndicator(commentIndicator) {
    commentIndicator.setAttribute(
        'data-content',
        TranscriptLineElement.#COMMENT_INDICATOR_POPOVER_MESSAGE);
    commentIndicator.setAttribute('data-toggle', 'popover');
  }

  /**
   * Creates a p tag to store the given `text` inside the
   * `container`.
   *
   * <p>Adds classes to the `p` tag if `classList` is provided.
   */
  static appendParagraphToContainer(text, container, classes = []) {
    container.appendChild(
        TranscriptLineElement.createParagraphWithClasses(text, classes));
  }

  /**
   * Creates a `p` tag to store the given `text`.
   *
   * <p>Adds classes to the `p` tag if `classList` is provided.
   */
  static createParagraphWithClasses(text, classes = []) {
    const pTag = document.createElement('p');
    pTag.innerText = text;
    if (classes.length == 0) {
      return;
    }
    pTag.classList.add(...classes);
    return pTag;
  }

  /**
   * Updates the template slot `slotName` with `slotValue`.
   */
  updateTemplateSlot(slotName, slotValue) {
    const span = document.createElement('span');
    span.innerText = slotValue;
    span.slot = slotName;
    this.appendChild(span);
  }

  /** Returns true if this element is bolded. */
  isBolded() {
    return this.classList.contains(TranscriptLineElement.#BOLD_FONT_WEIGHT);
  }

  /**
   * Bolds this element if it is not already bolded.
   */
  addBold() {
    if (this.isBolded()) {
      return;
    }
    this.classList.add(TranscriptLineElement.#BOLD_FONT_WEIGHT);
    this.classList.remove(TranscriptLineElement.#DEFAULT_FONT_WEIGHT);
  }

  /**
   * Removes bold from this element if it is currently bolded.
   */
  removeBold() {
    if (!this.isBolded()) {
      return;
    }
    this.classList.add(TranscriptLineElement.#DEFAULT_FONT_WEIGHT);
    this.classList.remove(TranscriptLineElement.#BOLD_FONT_WEIGHT);
  }

  /**
   * Returns true if `timestampMs` is within the time range of
   * this transcript line element.
   */
  isWithinTimeRange(timestampMs) {
    return this.transcriptLine.startTimestampMs <= timestampMs &&
        timestampMs <= this.transcriptLine.endTimestampMs;
  }

  /**
   * Returns true if the starting time of this element is before `timeMs`.
   */
  isBeforeTimeMs(timeMs) {
    return this.transcriptLine.startTimestampMs < timeMs;
  }
}

customElements.define(CUSTOM_ELEMENT_TRANSCRIPT_LINE, TranscriptLineElement);
