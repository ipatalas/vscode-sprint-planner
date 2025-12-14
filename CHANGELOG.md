# Change Log
All notable changes to the "vscode-sprint-planner" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.


## [0.7.0]
### Added
- Merged [#53](https://github.com/ipatalas/vscode-sprint-planner/pull/53):
  - Added team member completion provider for better developer experience
  - Updated Azure DevOps API version to 7.1 (from 5.0/5.1)
  - Improved task formatting with better spacing for assignees and tags
  - Added new interfaces for Tags and Team Members
### Changed
- Bumped all packages to latest versions
- Extension is now bundled and 60% smaller (1MB -> 400KB)
### Fixed
- Fixed part of [#32](https://github.com/ipatalas/vscode-sprint-planner/issues/32) related to not pulling estimate field for Scrum process type

## [0.6.6]
### Changed
- Updated logo, title and description to comply with Microsoft guidelines

## [0.6.5]
### Changed
- Updated icon because got an email from the marketplace team that it's too similar to another extension

## [0.6.4]
### Added
- Fix work item link generation for custom domain

## [0.6.3]
### Added
- Experimental support for custom domain (addresses [#49](https://github.com/ipatalas/vscode-sprint-planner/issues/49))

## [0.6.2]
### Fixed
- Fixed [#46](https://github.com/ipatalas/vscode-sprint-planner/issues/46)

## [0.6.1]
### Added
- Merged [#43](https://github.com/ipatalas/vscode-sprint-planner/pull/43) to fix [#42](https://github.com/ipatalas/vscode-sprint-planner/issues/42)

## [0.6.0]
### Added
- Support for proxy url (addresses [#28](https://github.com/ipatalas/vscode-sprint-planner/issues/28))

## [0.5.0]
### Added
- Support for setting Area Path for user stories (addresses [#23](https://github.com/ipatalas/vscode-sprint-planner/issues/23))
- Command to sync tasks from Azure DevOps (addresses [#11](https://github.com/ipatalas/vscode-sprint-planner/issues/11))
### Changed
- Better error handling for Publish/Sync tasks commands (show original Azure DevOps error which should be more helpful)
- Order of added tasks should now be preserved (fixes [#25](https://github.com/ipatalas/vscode-sprint-planner/issues/25))

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