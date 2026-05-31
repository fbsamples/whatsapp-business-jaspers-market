<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GEZM & RIM | Chingu Style</title>
    <!-- خطوط Google Fonts أنيقة ومناسبة للتصميم الكوري والـ Preppy -->
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
    
    <style>
        /* ==================== CSS التنسيق والألوان ==================== */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Poppins', sans-serif;
            background-color: #FAF6F0; /* لون كريمي ناعم ومريح */
            color: #4A4A4A;
            scroll-behavior: smooth;
        }

        /* الهيدر والقائمة العلوية Navbar */
        .navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 8%;
            background-color: #FFFFFF;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
            position: sticky;
            top: 0;
            z-index: 1000;
        }

        .logo {
            font-family: 'Fredoka', sans-serif;
            font-size: 26px;
            font-weight: 600;
            color: #FFB7B2; /* الوردي اللطيف الخاص بـ Chingu Style */
            letter-spacing: 1px;
        }

        .nav-links {
            display: flex;
            list-style: none;
        }

        .nav-links li {
            margin-left: 30px;
        }

        .nav-links a {
            text-decoration: none;
            color: #8E8E8E;
            font-weight: 400;
            font-size: 15px;
            transition: all 0.3s ease;
        }

        .nav-links a:hover, .nav-links a.active {
            color: #FFB7B2;
            font-weight: 600;
        }

        /* الواجهة الرئيسية Hero Section */
        .hero-section {
            height: 75vh;
            background: linear-gradient(135deg, #FFE5EC 0%, #FFCAD4 100%); /* تدرج وردي ناعم جداً */
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 0 20px;
        }

        .hero-content h1 {
            font-family: 'Fredoka', sans-serif;
            font-size: 52px;
            color: #4A4A4A;
            margin-bottom: 15px;
        }

        .hero-content .highlight {
            color: #FFFFFF;
            background-color: #FFB7B2;
            padding: 0px 15px;
            border-radius: 12px;
        }

        .hero-content p {
            font-size: 18px;
            color: #6C6C6C;
            margin-bottom: 30px;
            font-weight: 300;
        }

        .btn-primary {
            display: inline-block;
            padding: 14px 35px;
            background-color: #FFFFFF;
            color: #FFB7B2;
            text-decoration: none;
            font-weight: 600;
            border-radius: 30px;
            box-shadow: 0 5px 20px rgba(255, 183, 178, 0.4);
            transition: all 0.3s ease;
        }

        .btn-primary:hover {
            background-color: #FFB7B2;
            color: #FFFFFF;
            transform: translateY(-3px);
        }

        /* قسم شبكة التنسيقات والملابس Grid Section */
        .section-container {
            padding: 80px 8%;
        }

        .section-title {
            text-align: center;
            font-family: 'Fredoka', sans-serif;
            font-size: 36px;
            margin-bottom: 50px;
            color: #4A4A4A;
        }

        .section-title::after {
            content: '';
            display: block;
            width: 60px;
            height: 4px;
            background-color: #FFB7B2;
            margin: 12px auto 0 auto;
            border-radius: 10px;
        }

        .grid-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 35px;
        }

        .card {
            background: #FFFFFF;
            border-radius: 20px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 8px 24px rgba(0,0,0,0.02);
            transition: all 0.3s ease;
            border: 1px solid #FDFBF7;
        }

        .card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 30px rgba(255, 183, 178, 0.15);
        }

        .card-img-placeholder {
            height: 280px;
            background-color: #F5EBE6; /* لون بيج ناعم مكان الصورة */
            border-radius: 15px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #A3A3A3;
            font-size: 14px;
            font-style: italic;
            font-weight: 300;
        }

        .card h3 {
            font-size: 20px;
            margin-bottom: 10px;
            color: #4A4A4A;
            font-weight: 600;
        }

        .card p {
            font-size: 14px;
            color: #8C8C8C;
            line-height: 1.6;
        }

        /* الفوتر السفلي Footer */
        .main-footer {
            text-align: center;
            padding: 40px;
            background-color: #FFFFFF;
            color: #B5B5B5;
            font-size: 14px;
            border-top: 1px solid #FAF6F0;
        }
    </style>
</head>
<body>

    <!-- القائمة العلوية Navigation Bar -->
    <nav class="navbar">
        <div class="logo">GEZM & RIM</div>
        <ul class="nav-links">
            <li><a href="#home" class="active">Home</a></li>
            <li><a href="#outfits">Outfits</a></li>
            <li><a href="#aesthetic">Aesthetic</a></li>
            <li><a href="#community">Community</a></li>
        </ul>
    </nav>

    <!-- الواجهة الرئيسية للموقع Hero Section -->
    <header id="home" class="hero-section">
        <div class="hero-content">
            <h1>Discover Your <span class="highlight">Chingu Style</span></h1>
            <p>Your ultimate destination for Korean Aesthetic & Preppy fashion inspiration.</p>
            <a href="#outfits" class="btn-primary">Explore Outfits</a>
        </div>
    </header>

    <!-- قسم عرض الملابس والتنسيقات Outfits Section -->
    <section id="outfits" class="section-container">
        <h2 class="section-title">Trending Outfits</h2>
        <div class="grid-container">
            <!-- الكرت الأول -->
            <div class="card">
                <div class="card-img-placeholder">Preppy Look 1</div>
                <h3>Classic School Look</h3>
                <p>Pleated skirt, oversized V-neck sweater, and neat loafers.</p>
            </div>
            <!-- الكرت الثاني -->
            <div class="card">
                <div class="card-img-placeholder">Soft Aesthetic 2</div>
                <h3>Casual Pastel Look</h3>
                <p>Oversized knit hoodie paired with soft pastel denim jeans.</p>
            </div>
            <!-- الكرت الثالث -->
            <div class="card">
                <div class="card-img-placeholder">Street Style 3</div>
                <h3>Hongdae Streetwear</h3>
                <p>Comfortable cargo pants, minimal crop top, and a cool bucket hat.</p>
            </div>
        </div>
    </section>

    <!-- الفوتر السفلي للموقع Footer -->
    <footer class="main-footer">
        <p>&copy; 2026 GEZM & RIM. Created with ♡ for Chingu Style.</p>
    </footer>

</body>
</html>

# Jasper's Market WhatsApp Bot

Jasper's Market is a fictional grocery brand created to showcase key features of the WhatsApp Business Platform. The bot leverages key features to deliver a great customer experience. Using this demo as inspiration, you can create a delightful WhatsApp experience that leverages both automation and live customer support.

[Access the WhatsApp experience](https://wa.me/15558813169?text=Get+started)

See the [Developer Documentation on this experience](https://developers.facebook.com/documentation/business-messaging/whatsapp/overview).

# Setting up your WhatsApp App

## Requirements

- **Meta Developer Account:** Required to create new apps, which are the core of any Meta integration. You can create a new developer account by going to the [Meta Developers website](https://developers.facebook.com/) and clicking the "Get Started" button.
- **Meta App:** Contains the settings for your WhatsApp automation, including access tokens. To create a new app, visit your [app dashboard](https://developers.facebook.com/apps).
- **Meta Business:** This is a pre-requisite for building with WhatsApp. If you don't have a business, you can create one in the app creation flow.
- **WhatsApp Business Account:** This is needed to send and receive messages in WhatsApp. To create a new WhatsApp Business account, visit [Meta Business Suite](https://business.facebook.com/latest).

## Setup Steps

Before you begin, make sure you have completed all of the requirements listed above. At this point you should have a Business and a registered Meta App.

#### Get the App id, App Secret, App Token, and Waba id

1. Go to your app Basic Settings, [Find your app here](https://developers.facebook.com/apps)
2. Save the **App ID** number and the **App Secret**
3. Go to your Business in Meta Business Suite and find your desired WhatsApp Business Account under the WhatsApp tab.
4. Save the **Waba ID**
5. Create a system user token for your app. Save this **App token**. [Find instructions here](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started#1--acquire-an-access-token-using-a-system-user-or-facebook-login)

#### Grant WhatsApp access to your developer app

1. Go to your app Dashboard
2. Under _Add Product_ find _WhatsApp_ and click _Set Up_
3. Now you should be in the App's WhatsApp Settings.
4. Navigate to the _Configuration_ tab.

# Installation

Clone this repository on your local machine:

```bash
$ git clone git@github.com:fbsamples/whatsapp-business-jaspers-market.git
$ cd whatsapp-business-jaspers-market
```

You will need:

- [Node](https://nodejs.org/en/) 10.x or higher
- Remote server service, a local tunneling service such as [ngrok](https://ngrok.com/), or your own webserver.

# Usage

## Using ngrok

#### 1. Setup templates
In order for the app to send templated messages, you need to first create those templates under your WhatsApp Business Account. You can either do this by running `./template.sh` or through [WhatsApp Manager](https://business.facebook.com/latest/whatsapp_manager/message_templates).

#### 2. Install Redis
If not already installed, install redis via [download](https://redis.io/docs/latest/operate/oss_and_stack/install/install-stack/).

You can then start a redis daemon locally via command line:

```bash
redis-server --daemonize yes
```

#### 3. Install tunneling service

If not already installed, install ngrok via [download](https://ngrok.com/download) or via command line:

```bash
npm install -g ngrok
```

In the directory of this repo, request a tunnel to your local server with your preferred port
```bash
ngrok http 8080
```

The screen should show the ngrok status:

```
Session Status                online
Account                       Redacted (Plan: Free)
Version                       2.3.35
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://1c3b838deacb.ngrok.io -> http://localhost:3000
Forwarding                    https://1c3b838deacb.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```
Note the https URL of the external server that is forwarded to your local machine. In the above example, it is `https://1c3b838deacb.ngrok.io`.

#### 4. Install the dependencies

Open a new terminal tab, also in the repo directory.

```bash
$ npm install
```

Alternatively, you can use [Yarn](https://yarnpkg.com/en/):

```bash
$ yarn install
```

#### 5. Set up .env file

Copy the file `.sample.env` to `.env`

```bash
cp .sample.env .env
```

Edit the `.env` file to add all the saved secrets. Note that `VERIFY_TOKEN` will be a passphrase you create that will handshake your app with webhook subscription process.

#### 6. Run your app locally

```bash
node app.js
```

#### 7. Configure your webhook subscription

Use the `VERIFY_TOKEN` that you created in `.env` file and subscribe your webhook server's URL for WhatsApp webhooks in your developer page's _Configuration_ tab. Make sure to subscribe to the messages field. Note that the app listens to webhooks on the `/webhook` endpoint.

#### 8. Test that your app setup is successful

Send a message to your WhatsApp Business Account from a consumer WhatsApp number.

You should see the webhook called in the ngrok terminal tab, and in your application terminal tab.

If you see a response to your message in WhatsApp, you have fully set up your app! Voilà!

## License

Sample WhatsApp App Jasper's Market is Apache 2.0 licensed, as found in the LICENSE file.

See the [CONTRIBUTING](CONTRIBUTING.md) file for how to help out.

Terms of Use - https://opensource.facebook.com/legal/terms
Privacy Policy - https://opensource.facebook.com/legal/privacy
