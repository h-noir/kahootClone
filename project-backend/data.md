```javascript
let data = {
	users: [ 
		{
			userId: 1,
			nameFirst: 'Flynn',
			nameLast: 'Rider',
			userEmail: 'flynn.rider@gmail.com',
			userNewPassword: 'smoulder12.',
			userOldPasswords: ['smoulder101.'],
			numSuccessfulLogins: 1,
			numFailedPasswordsSinceLastLogin: 1,
			quizIds:[1],
			trash:[],
		},
	],
	quizzes: [ 
		{
			quizId: 1,
			name: 'Learning git',
			timeCreated: 1095379199,
			timeLastEdited: 1095379200,
			description: 'How to use git',
			quizOwnerId: [1],
			usersAccessed: [1],
			questions: [
				{
					questionId: 1,
					question: 'Random question',
					duration: 1,
					thumbnailUrl: 'http://google.com/some/image/path.jpg',
					points: 100,
					answers: [
						{
							answerId: 1,
							answer: 'choice 1',
							color: 'Red',
							correct: true,
						},
						{
							answerId: 2,
							answer: 'choice 2',
							color: 'Blue',
							correct: false,
						},
					],
					timeCreated: 1095379200,
					timeLastEdited: 1095379200,
				}
			],
			questionIds: [1],
			duration: 1,
			thumbnailUrl: 'http://google.com/some/image/path.jpg',
			latestQuestionId: 1,
			latestAnswerId: 2,
			quizSessionIds: [1];
		},
	],
	latestUserId: 0,
	latestQuizId: 0,
	latestQuizSessionId: 0,
	userSessions: [
		{ token: '2721', userId: 1 },
		{ token: '2731', userId: 1 },
	],
	quizSessions: [
		{
			quizSessionId: 1,
			autoStartNum: 3,
			state: 'LOBBY',
			atQuestion: 2,
			players: [
				{
					playerId: 1,
					name: 'Flynn Rider',
					score: 0,
				},
			],
			sessionQuestion: [
				{
					questionId: 1,
					startTime: 1095385288,
					submissions: [
						{
							playerId: 1,
							answerTime: 13,
							answerIds: [1, 2],
							score: 0,
						},
					]
					correctPlayersId: [1],
				},
			],
			messages: [
				messageBody: 'This is a message',
				playerId: 1,
				timeSent: 1095385300,
			]
			metadata: {
				// A copy of the whole quiz
			},
		}
	],
}
```

Short description: 
Each User has the following properties: Unique User Id, First and Last name, Email, Old and New passwords, Successful Logins, Number of failed passwords since the last login and an array containing the Quiz Id's owned by that user. 

Each Quiz has the follow properties: Unique Quiz Id, Quiz name, the timestamp it was created, the timestamp it was last edited, a description of the quiz, array of owners ids, array of users accessed, and array of questions and answers. 

