# AutomatedTesting

Automated testing routines using playwright.dev

## clone

Clone files from [Automated Testing](https://gitlab.com/ExeterPremedia/devops/automatedtesting.git ) repo

## Steps for installing the required packages 

<ol>
<li>After cloning the code goto the  folder that contains all the cloned code.</li>
<li>Change the branch to integration and then create your own branch</li>
<li>Open the terminal and type "npm install" - *command to install node modules*</li>
</ol>

## Create the below user with the same name and email in your local kriyadocs set-up 

<ol>
<li>First name: Automation</li>
<li>Last name: Testing</li>
<li>Email: testingautomation@exeterpremedia.com</li>
<li>Password can be anything but the same need to be added in the automation testing config mentioned below</li>
</ol>

## Create a .env file in your root of automation testing folder 

<ol>
<li>you can copy and rename the .env.sample as .env</li>
</ol>

## File location and naming to be followed

<ol>
<li>All the test case files should end with “.test”, example binder.test.js </li>
<li>And all the test files should be added to the tests folder</li>
<li>XML files which are used for testing purpose should be added/modified in ./tests/xmls folder</li>
<li>All XML files, if used for testing purpose should be assigned to Automation testing user which is mentioned above except external user testing like the publisher, copyeditor role testing</li>
<li>keep all config.json files in "configFiles" folder</li>
</ol>

## steps for running the file 

<ol>
<li>To run all the test cases use the command: "npm test"</li>
<li>"npm test" command will automatically run all the  files in the Test folder.</li>
<li>To run files individually type "npm test -- filename" in terminal.</li>
<li>Example: npm test -- editing-functions.test.js</li>
</ol>

## Test case files and the areas they cover

<p><b>Editor Page</b></p>
<p><i>editing-functions.tests.js</i></p>
<p>Basic editing functions like formatting the text, typing words, deleting texts are tested in this test cases to make sure the HTML editor is working as expected<br/></p>

<p><i>editor-components.tests.js</i></p>
<p>Kriydocs components for authors, affiliations and other popup components and their functionality are tested<br/></p>

<p><b>Dashboard and Binder</b></p>
<p><i>dashboard-new.test.js</i><br/></p>

<p><i>binder.test.js</i><br/></p>

<p><i>copyeditor.test.js</i><br/></p>

<p><b>Submisstion and Peer review editor</b></p>
<p><i>submission-page.test.js</i></p>
<p>Submission process is tested step-by-step till the end until it is submitted<br/></p>

<p><i>peerreview-ui.test.js</i></p>
<p>All UI related test cases inside peer review editor<br/></p>

## steps for getting the report

<ol>
<li>After the running the file.</li>
<li>Go to the reports folder.</li>
<li>In reports folder you can see two files <b>report.html</b> and <b>report.json</b> <br> *These files are Generated after the files are tested.*</li>
<li>Open the report.html file in a browser. so that you can get visualization of all the testcases both passed and failed.</li> 
</ol>





 