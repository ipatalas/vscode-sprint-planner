/* eslint-disable @typescript-eslint/no-non-null-assertion */
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const expect = require('expect.js') as (target?: any) => Expect.Root;
import { TextProcessor } from '../utils/textProcessor';

describe('Given TextProcessor', function () {
    it('when calling getUserStoryLineIndices', function () {
        const lines = [
            'US#1',
            'US#2',
            'US#3',
            '',
            'US#4',
            '',
            'US#5',
        ];

        const results = TextProcessor.getUserStoryLineIndices(lines);

        expect(results).to.be.eql([0, 1, 2, 4, 6]);
    });

    it.only('when calling getUserStory for existing US', () => {
        const lines = `US#13 - User Story Title (just informational)
Development:
- Discussion of the idea, 1h @john@doe.com #TEST #TOTO [#101]
- Create metrics for User Story, 4h [#102]
	Description of the task, leading whitespaces will be trimmed
	It can be multiline as well, emojis more than welcome 👌😎
- XXX-1234
- XXX-2345, 1h
Testing:
- Integration tests, 2h [#103]
- UI tests, 4h [#104]
- small task, 0.5h [#105]
- even smaller one, 3m`.split('\n');

        const results = TextProcessor.getUserStory(lines, 0);

        expect(results).to.be.ok();
        expect(results!.title).to.be('User Story Title (just informational)');
        expect(results!.id).to.be(13);
        expect(results!.line).to.be(0);
        expect(results!.tasks).to.have.length(8);
        expect(results!.tasks[0]).to.be.eql({
            activity: 'Development',
            description: [],
            estimation: 1,
            title: 'Discussion of the idea',
            line: 2,
            id: 101,
            assignee: 'john@doe.com',
            tags: ['TEST', 'TOTO']
        });

        expect(results!.tasks[1]).to.be.eql({
            estimation: 4,
            title: 'Create metrics for User Story',
            description:
                ['Description of the task, leading whitespaces will be trimmed',
                    'It can be multiline as well, emojis more than welcome 👌😎'],
            activity: 'Development',
            line: 3,
            id: 102
        });
        expect(results!.tasks[2]).to.be.eql({
            title: 'XXX-1234',
            description: [],
            activity: 'Development',
            line: 6
        });
        expect(results!.tasks[3]).to.be.eql({
            title: 'XXX-2345',
            estimation: 1,
            description: [],
            activity: 'Development',
            line: 7
        });
        expect(results!.tasks[4]).to.be.eql({
            estimation: 2,
            title: 'Integration tests',
            description: [],
            activity: 'Testing',
            line: 9,
            id: 103
        });
        expect(results!.tasks[5]).to.be.eql({
            estimation: 4,
            title: 'UI tests',
            description: [],
            activity: 'Testing',
            line: 10,
            id: 104
        });
        expect(results!.tasks[6]).to.be.eql({
            estimation: 0.5,
            title: 'small task',
            description: [],
            activity: 'Testing',
            line: 11,
            id: 105
        });
        expect(results!.tasks[7]).to.be.eql({
            estimation: 0.05,
            title: 'even smaller one',
            description: [],
            activity: 'Testing',
            line: 12
        });
    });

    it('when calling getUserStory for new US', () => {
        const lines = `US#new - New User Story
Development:
- Discussion of the idea, 1h
- Create metrics for User Story, 4h
	Description of the task, leading whitespaces will be trimmed
	It can be multiline as well, emojis more than welcome 👌😎
- New sample task`.split('\n');

        const results = TextProcessor.getUserStory(lines, 0);

        expect(results).to.be.ok();
        expect(results!.title).to.be('New User Story');
        expect(results!.id).to.be.equal(undefined);
        expect(results!.tasks.length).to.be.equal(3);
    });

    it('when calling getUserStory with areas', function () {
        const lines = `US#1
Area: A1
US#2
US#3

Area: A2
US#4
Area: A3
US#5`.split('\n');

        const results = TextProcessor.getUserStoryLineIndices(lines);
        const userStories = results.map(line => TextProcessor.getUserStory(lines, line)!);

        expect(results).to.be.eql([0, 2, 3, 6, 8]);
        expect(userStories[0].areaPath).to.be.equal(undefined);
        expect(userStories[1].areaPath).to.be.equal('A1');
        expect(userStories[2].areaPath).to.be.equal('A1');
        expect(userStories[3].areaPath).to.be.equal('A2');
        expect(userStories[4].areaPath).to.be.equal('A3');
    });
});