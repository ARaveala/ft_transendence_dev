Here is rough idea of an agenda for friday at 15:00 , This agenda can be moved to trancendence docu repo afterwards if everyone would like to keep it .

## what to do with dev branch system
Goal: Define a branching model that supports collaboration, testing, and modular development without bottlenecks.

#### Option 1: Shared Dev Branch (branched from main)
- Everyone pushes their tested code into their own folders/directories
- Centralized but potentially messy over time

#### Option 2: Empty Dev Branch (clean slate)
- Dev branch starts empty
- Each contributor adds their tested code in isolated folders
- Encourages modularity but lacks shared base code

#### Option 3: Dev Branch with Server Code Only
- Dev branch contains only server code
- Contributors pull from it, test their own modules locally, then push updates
- Keeps server logic centralized, but may cause merge conflicts if not coordinated

#### Option 4: Dedicated Server Branch
- Server code lives in its own branch (server)
- Dev branch is branched from server and used for integration/testing
- Clear separation of concerns, easier to manage server updates

### Option 5: Multibranch system
- Testing branch we can all merge to on a regular basis after some testing only 1 review required? 
- This gets merged to dev branch , where we can state the requierement of multiple code reviews
- Merge to main everyone reviews? testing branch is updated ? something like this
- File structure will have to be clear 

#### Discussion Point: What gives contributors the most control?
- Should everyone work in isolated feature branches instead?
- Do we want to enforce folder structure or leave it open?
- How do we handle merge conflicts and code reviews?
- How do we not step on eachothers toes when we want to test everyones latest updates in a local repo, testing branch to dev ?

  ## clear requiremenst between work loads
  Frontend , Backend (general) and Database have a plan to have shared folders that contain api protocol and payloads which can be easily utalized to cross reference what is needed between us,
  these shared files are usable, not just references.
  - Are there any other systems like this one that would help simplify this type of communication.
  - Documentation can get messy do we have clear boundries and requirements , should we all work of the same baisic template ?
  <details>
    <summary>example of template</summary>
  
  ## overview
  - general explanatiom  
  ## folder structure?
  - small explanations what sists inside what ?
  ## how to use
  - step by step guid in usage
  ## installs
  - any installs that have been made (briefly why/what for)
  ## bugs
  - fixed
  - not fixed
  ## generale notes
  

  </details>

# what is done and tested
- Proof of fucntionality
- Is any module completed, do we need to retask
  
# whats the next move 
- Is there anything ready to be tested with somebody elses updated code
