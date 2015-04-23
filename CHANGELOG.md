# Changelog

## 1.0.0

We are `1.0.0` now, because there are no reasons to hang out a at `0.x` versioning anymore. There are no breaking API changes - only some behavior changed slightly.

### New Features

- add drop animation
- add `placeholderTag` option (#21)
- allow drop cancelation during `droppable:drop` (#26)#
- add `receiveHandler` sortable option

### Improvements

- replace [`jquery-observe`](https://github.com/rkusa/jquery-observe) with [`selector-observer`](https://github.com/rkusa/selector-observer) for improved DOM change detection
- make `connectWith` to take later added elements into account

### Bugfixes

- remove sortable drop flicker
- when delegating events, preserve original event properties (#22)
- fix cloned handle
- fix placeholder tag detection (#21)
- fix sortable hiding (#21)
- ignore right and middle mouse button (#21)
- properly restore drag element styles (#23)
- fix `sortable:stop` event (#24)
- cleanup inline css after drop (#23)
- fix sortable for mobile devices (#25)
- fix hoverClass
- fix droppable:drop (#26)
- fix IE touch compatibility
- fix iframe cross origin

## 0.5.1

### Bugfixes

- fix sorting (#19)
- fix general placement (#20)

## 0.5.0

### Improvements

- do not hide sorted elements by moving them to the end of the list. Set their `margin-top` to their negative `height` instead
- add sortable position hook
- improve index calculation
- improve bundle friendliness

## 0.4.3

### Bugfixes

- fix `forcePlaceholderSize` for `box-sizing: border-box` #16 

## 0.4.2

### Bugfixes

* fix z-index

## 0.4.1

### Bugfixes

* restore IE touch compatibility

## 0.4.0

### New Features

- add automatic scrolling while dragging
- adjust dragging element's position while scrolling

### Bugfixes

- fix sortable item revert
- fix sortable item placement
- fix IE (11)
- fix Firefox
- fix sortable placeholder placement
- fix sortable height
- fix initial placeholder position
- fix disappearing of list items

## 0.3.0

- Add `clone` option for draggables.