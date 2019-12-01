# Change Log
All notable changes to the "vscode-sprint-planner" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.4.0]
### Added
- Support for Scrum process type (with Product Backlog Items)
### Fixed
- Don't reload snippets when they have not been changed in the configuration

## [0.3.0]
### Added
- Ability to update existing tasks
- Ability to add new User Story
- Progress bar to show publish operation progress
### Changed
- Updated grammar to be more reliable. For instance it should no longer highlight estimation-like text in User Story line.

## [0.2.0]
### Added
- Activity type decoration (number of tasks and hours per activity)
- Support for task snippets loaded from disk or HTTP
### Changed
- Support decimal numbers in estimation or estimation in minutes

## [0.1.0]
### Added
- Ability to select arbitrary activity (defaulted to Development)
- Ability to select arbitrary iteration (still defaulted to current)
### Changed
- Make `h` in estimation optional
### Fixed
- Proper syntax highlighting when task title has commas
- Minor error handling improvements

## [0.0.3]
### Fixed
- Could not publish tasks to an empty User Story

## [0.0.2]
- Changed the way API Url is built, it now requires Organization name, Project name, Team name separately since different API calls require different URLs

## [0.0.1]
- Initial release