# Magic-Club
based on Node.js, Express, MongoDB, Pug, fetch

# [About]

Users at the landing page are greeted and encouraged to join the magic club. They can sign up and after validated, they will be redirected to the previous landing page, but this time with content only can be seen by members when logged in. A member can log out and log in later.

After log in, a member can view list of members in the club and list of magic tricks. Details of each member and each trick are also available. They can also submit tricks they are interested in. A suspended member won't be able to log in.

If the member is also an admin, they can see extra action buttons to suspend or (re)activate members, and edit or delete tricks.

# [Deployment]

Deployed on Heroku: https://little-magic-club.herokuapp.com, connected to MongoDB mLab. The sole admin of the club is admin@mail.com. 

# [Techniques]

[1] tried axios, and jQuery.ajax, decided to use fetch -- stick to vanilla JS

[2] tried view engine Handlebars, Ejs, decided to use Pug -- like its mixin

[3] jQuery replaced by vanilla JS
