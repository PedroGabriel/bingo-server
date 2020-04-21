default:
	export LOGLEVEL=dev && npx nodemon --inspect index.js
d:
	export LOGLEVEL=dev && npx nodemon --inspect index.js
p:
	export LOGLEVEL=prod && npx nodemon --inspect index.js
t:
	export LOGLEVEL=test && npx nodemon --inspect index.js
seed:
	node tests/loadtest/seed.js
test:
	npx artillery run tests/loadtest/artillery.yml
