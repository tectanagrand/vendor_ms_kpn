const Email = {
    manager: (ven_name, ven_type, comp, reason) => {
        return `
            <!doctype html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width" />
                <title>Email Notification</title>
                <link
                    href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
                    rel="stylesheet"
                />
                <style>
                    html,
                    body {
                        margin: 0 auto !important;
                        padding: 0 !important;
                        height: 100% !important;
                        width: 100% !important;
                        background: #f1f1f1;
                    }

                    /* What it does: Stops email clients resizing small text. */
                    * {
                        -ms-text-size-adjust: 100%;
                        -webkit-text-size-adjust: 100%;
                    }

                    /* What it does: Centers email on Android 4.4 */
                    div[style*="margin: 16px 0"] {
                        margin: 0 !important;
                    }

                    /* What it does: Stops Outlook from adding extra spacing to tables. */
                    table,
                    td {
                        mso-table-lspace: 0pt !important;
                        mso-table-rspace: 0pt !important;
                    }

                    /* What it does: Fixes webkit padding issue. */
                    table {
                        border-spacing: 0 !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                        margin: 0 auto !important;
                    }

                    /* What it does: Uses a better rendering method when resizing images in IE. */
                    img {
                        -ms-interpolation-mode: bicubic;
                    }

                    /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
                    a {
                        text-decoration: none;
                    }

                    /* What it does: A work-around for email clients meddling in triggered links. */
                    *[x-apple-data-detectors],  /* iOS */
                .unstyle-auto-detected-links *,
                .aBn {
                        border-bottom: 0 !important;
                        cursor: default !important;
                        color: inherit !important;
                        text-decoration: none !important;
                        font-size: inherit !important;
                        font-family: inherit !important;
                        font-weight: inherit !important;
                        line-height: inherit !important;
                    }

                    /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
                    .a6S {
                        display: none !important;
                        opacity: 0.01 !important;
                    }

                    /* What it does: Prevents Gmail from changing the text color in conversation threads. */
                    .im {
                        color: inherit !important;
                    }

                    /* If the above doesn't work, add a .g-img class to any image in question. */
                    img.g-img + div {
                        display: none !important;
                    }

                    /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
                    /* Create one of these media queries for each additional viewport size you'd like to fix */

                    /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
                    @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                        u ~ div .email-container {
                            min-width: 320px !important;
                        }
                    }
                    /* iPhone 6, 6S, 7, 8, and X */
                    @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                        u ~ div .email-container {
                            min-width: 375px !important;
                        }
                    }
                    /* iPhone 6+, 7+, and 8+ */
                    @media only screen and (min-device-width: 414px) {
                        u ~ div .email-container {
                            min-width: 414px !important;
                        }
                    }
                </style>

                <!-- CSS Reset : END -->

                <!-- Progressive Enhancements : BEGIN -->
                <style>
                    .primary {
                        background: #2f89fc;
                    }
                    .bg_white {
                        background: #ffffff;
                    }
                    .bg_light {
                        background: #fafafa;
                    }
                    .bg_black {
                        background: #000000;
                    }
                    .bg_dark {
                        background: rgba(0, 0, 0, 0.8);
                    }
                    .email-section {
                        padding: 2.5em;
                    }

                    /*BUTTON*/
                    .btn {
                        padding: 5px 15px;
                        display: inline-block;
                    }
                    .btn.btn-primary {
                        border-radius: 5px;
                        background: #2f89fc;
                        color: #ffffff;
                    }
                    .btn.btn-white {
                        border-radius: 5px;
                        background: #ffffff;
                        color: #000000;
                    }
                    .btn.btn-white-outline {
                        border-radius: 5px;
                        background: transparent;
                        border: 1px solid #fff;
                        color: #fff;
                    }

                    h1,
                    h2,
                    h3,
                    h4,
                    h5,
                    h6 {
                        font-family: "Montserrat", sans-serif;
                        color: #000000;
                        margin-top: 0;
                        font-weight: 400;
                    }

                    body {
                        font-family: "Montserrat", sans-serif;
                        font-weight: 400;
                        font-size: 15px;
                        line-height: 1.8;
                        color: #000000;
                    }

                    a {
                        color: #2f89fc;
                    }

                    table {
                    }
                    /*LOGO*/

                    .logo h1 {
                        margin: 0;
                    }
                    .logo h1 a {
                        color: #000000;
                        font-size: 20px;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-family: "Montserrat", sans-serif;
                    }

                    .navigation {
                        padding: 0;
                    }
                    .navigation li {
                        list-style: none;
                        display: inline-block;
                        margin-left: 5px;
                        font-size: 13px;
                        font-weight: 500;
                    }
                    .navigation li a {
                        color: rgba(0, 0, 0, 0.4);
                    }

                    /*HERO*/
                    .hero {
                        position: relative;
                        z-index: 0;
                    }

                    .hero .text {
                        color: rgba(0, 0, 0, 0.3);
                    }
                    .hero .text h2 {
                        color: #000;
                        font-size: 30px;
                        margin-bottom: 0;
                        font-weight: 300;
                    }
                    .hero .text h2 span {
                        font-weight: 600;
                        color: #2f89fc;
                    }

                    /*HEADING SECTION*/
                    .heading-section {
                    }
                    .heading-section h2 {
                        color: #000000;
                        font-size: 28px;
                        margin-top: 0;
                        line-height: 1.4;
                        font-weight: 400;
                    }
                    .heading-section .subheading {
                        margin-bottom: 20px !important;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(0, 0, 0, 0.4);
                        position: relative;
                    }
                    .heading-section .subheading::after {
                        position: absolute;
                        left: 0;
                        right: 0;
                        bottom: -10px;
                        content: "";
                        width: 100%;
                        height: 2px;
                        background: #2f89fc;
                        margin: 0 auto;
                    }

                    .heading-section-white {
                        color: rgba(255, 255, 255, 0.8);
                    }
                    .heading-section-white h2 {
                        line-height: 1;
                        padding-bottom: 0;
                    }
                    .heading-section-white h2 {
                        color: #ffffff;
                    }
                    .heading-section-white .subheading {
                        margin-bottom: 0;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(255, 255, 255, 0.4);
                    }

                    /*PROJECT*/
                    .text-project {
                        padding-top: 10px;
                    }
                    .text-project h3 {
                        margin-bottom: 0;
                    }
                    .text-project h3 a {
                        color: #000;
                    }

                    /*FOOTER*/

                    .footer {
                        color: rgba(255, 255, 255, 0.5);
                    }
                    .footer .heading {
                        color: #ffffff;
                        font-size: 20px;
                    }
                    .footer ul {
                        margin: 0;
                        padding: 0;
                    }
                    .footer ul li {
                        list-style: none;
                        margin-bottom: 10px;
                    }
                    .footer ul li a {
                        color: rgba(255, 255, 255, 1);
                    }

                    @media screen and (max-width: 500px) {
                    }
                </style>
            </head>
            <body
                width="100%"
                style="
                    margin: 0;
                    padding: 0 !important;
                    mso-line-height-rule: exactly;
                    background-color: #222222;
                "
            >
                <center style="width: 100%; background-color: #f1f1f1">
                    <div
                        style="max-width: 600px; margin: 0 auto"
                        class="email-container"
                    >
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                            class="bg_white"
                        >
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <table
                                        role="presentation"
                                        border="0"
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                    >
                                        <tr>
                                            <td class="logo" style="text-align: left">
                                                <img
                                                    width="40%"
                                                    src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                                />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <table>
                                    <tr>
                                        <td
                                            valign="top"
                                            class="bg_white"
                                            style="padding: 1em 2.5em"
                                        >
                                            <h4>
                                                Dear Mr. Brian, <br />
                                                Please approve for vendor who have
                                                participated in the tender at KPN Corp :
                                            </h4>
                                        </td>
                                    </tr>
                                </table>
                            </tr>
                            <tr>
                                <table class="bg_white" width="100%">
                                    <tr>
                                        <td width="20%" style="padding: 0.1em 2.5em">
                                            Vendor Name
                                        </td>
                                        <td style="padding: 0.1em 2.5em">
                                            : ${ven_name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td width="20%" style="padding: 0.1em 2.5em">
                                            Vendor Type
                                        </td>
                                        <td style="padding: 0.1em 2.5em">: ${ven_type}</td>
                                    </tr>
                                    <tr>
                                        <td width="20%" style="padding: 0.1em 2.5em">
                                            Company
                                        </td>
                                        <td style="padding: 0.1em 2.5em">: ${comp}</td>
                                    </tr>
                                    <tr>
                                        <td width="20%" style="padding: 2em 2.5em">
                                            Action
                                        </td>
                                        <td style="padding: 0.1em 2.5em">
                                            <div
                                                class="btn btn-primary"
                                                style="
                                                    padding-left: 2em;
                                                    padding-right: 2em;
                                                "
                                            >
                                                Yes
                                            </div>
                                            <div
                                                class="btn btn-primary"
                                                style="
                                                    padding-left: 2em;
                                                    padding-right: 2em;
                                                "
                                            >
                                                No
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td width="50%" style="padding: 1em 2.5em">
                                            Reason
                                        </td>
                                        <td style="padding: 0.1em 2.5em 2em">
                                            <div
                                                style="
                                                    padding: 1em;
                                                    border: 1px solid black;
                                                "
                                            >
                                                ${reason}
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </tr>
                        </table>
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                        >
                            <tr>
                                <td
                                    valign="middle"
                                    class="bg_black footer email-section"
                                >
                                    <table>
                                        <tr>
                                            <td>KPN Corp Copyright 2023</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>
                </center>
            </body>
        </html>

        `;
    },

    request: (ticket_num, requestor) => {
        return `<!doctype html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width" />
                <title>Email Notification</title>
                <link
                    href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
                    rel="stylesheet"
                />
                <style>
                    html,
                    body {
                        margin: 0 auto !important;
                        padding: 0 !important;
                        height: 100% !important;
                        width: 100% !important;
                        background: #f1f1f1;
                    }
        
                    /* What it does: Stops email clients resizing small text. */
                    * {
                        -ms-text-size-adjust: 100%;
                        -webkit-text-size-adjust: 100%;
                    }
        
                    /* What it does: Centers email on Android 4.4 */
                    div[style*="margin: 16px 0"] {
                        margin: 0 !important;
                    }
        
                    /* What it does: Stops Outlook from adding extra spacing to tables. */
                    table,
                    td {
                        mso-table-lspace: 0pt !important;
                        mso-table-rspace: 0pt !important;
                    }
        
                    /* What it does: Fixes webkit padding issue. */
                    table {
                        border-spacing: 0 !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                        margin: 0 auto !important;
                    }
        
                    /* What it does: Uses a better rendering method when resizing images in IE. */
                    img {
                        -ms-interpolation-mode: bicubic;
                    }
        
                    /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
                    a {
                        text-decoration: none;
                    }
        
                    /* What it does: A work-around for email clients meddling in triggered links. */
                    *[x-apple-data-detectors],  /* iOS */
                .unstyle-auto-detected-links *,
                .aBn {
                        border-bottom: 0 !important;
                        cursor: default !important;
                        color: inherit !important;
                        text-decoration: none !important;
                        font-size: inherit !important;
                        font-family: inherit !important;
                        font-weight: inherit !important;
                        line-height: inherit !important;
                    }
        
                    /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
                    .a6S {
                        display: none !important;
                        opacity: 0.01 !important;
                    }
        
                    /* What it does: Prevents Gmail from changing the text color in conversation threads. */
                    .im {
                        color: inherit !important;
                    }
        
                    /* If the above doesn't work, add a .g-img class to any image in question. */
                    img.g-img + div {
                        display: none !important;
                    }
        
                    /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
                    /* Create one of these media queries for each additional viewport size you'd like to fix */
        
                    /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
                    @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                        u ~ div .email-container {
                            min-width: 320px !important;
                        }
                    }
                    /* iPhone 6, 6S, 7, 8, and X */
                    @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                        u ~ div .email-container {
                            min-width: 375px !important;
                        }
                    }
                    /* iPhone 6+, 7+, and 8+ */
                    @media only screen and (min-device-width: 414px) {
                        u ~ div .email-container {
                            min-width: 414px !important;
                        }
                    }
                </style>
        
                <!-- CSS Reset : END -->
        
                <!-- Progressive Enhancements : BEGIN -->
                <style>
                    .primary {
                        background: #2f89fc;
                    }
                    .bg_white {
                        background: #ffffff;
                    }
                    .bg_light {
                        background: #fafafa;
                    }
                    .bg_black {
                        background: #000000;
                    }
                    .bg_dark {
                        background: rgba(0, 0, 0, 0.8);
                    }
                    .email-section {
                        padding: 2.5em;
                    }
        
                    /*BUTTON*/
                    .btn {
                        padding: 5px 15px;
                        display: inline-block;
                    }
                    .btn.btn-primary {
                        border-radius: 5px;
                        background: #2f89fc;
                        color: #ffffff;
                    }
                    .btn.btn-white {
                        border-radius: 5px;
                        background: #ffffff;
                        color: #000000;
                    }
                    .btn.btn-white-outline {
                        border-radius: 5px;
                        background: transparent;
                        border: 1px solid #fff;
                        color: #fff;
                    }
        
                    h1,
                    h2,
                    h3,
                    h4,
                    h5,
                    h6 {
                        font-family: "Montserrat", sans-serif;
                        color: #000000;
                        margin-top: 0;
                        font-weight: 400;
                    }
        
                    body {
                        font-family: "Montserrat", sans-serif;
                        font-weight: 400;
                        font-size: 15px;
                        line-height: 1.8;
                        color: #000000;
                    }
        
                    a {
                        color: #2f89fc;
                    }
        
                    table {
                    }
                    /*LOGO*/
        
                    .logo h1 {
                        margin: 0;
                    }
                    .logo h1 a {
                        color: #000000;
                        font-size: 20px;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-family: "Montserrat", sans-serif;
                    }
        
                    .navigation {
                        padding: 0;
                    }
                    .navigation li {
                        list-style: none;
                        display: inline-block;
                        margin-left: 5px;
                        font-size: 13px;
                        font-weight: 500;
                    }
                    .navigation li a {
                        color: rgba(0, 0, 0, 0.4);
                    }
        
                    /*HEADING SECTION*/
                    .heading-section {
                    }
                    .heading-section h2 {
                        color: #000000;
                        font-size: 28px;
                        margin-top: 0;
                        line-height: 1.4;
                        font-weight: 400;
                    }
                    .heading-section .subheading {
                        margin-bottom: 20px !important;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(0, 0, 0, 0.4);
                        position: relative;
                    }
                    .heading-section .subheading::after {
                        position: absolute;
                        left: 0;
                        right: 0;
                        bottom: -10px;
                        content: "";
                        width: 100%;
                        height: 2px;
                        background: #2f89fc;
                        margin: 0 auto;
                    }
        
                    .heading-section-white {
                        color: rgba(255, 255, 255, 0.8);
                    }
                    .heading-section-white h2 {
                        line-height: 1;
                        padding-bottom: 0;
                    }
                    .heading-section-white h2 {
                        color: #ffffff;
                    }
                    .heading-section-white .subheading {
                        margin-bottom: 0;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(255, 255, 255, 0.4);
                    }
        
                    /*FOOTER*/
        
                    .footer {
                        color: rgba(255, 255, 255, 0.5);
                    }
                    .footer .heading {
                        color: #ffffff;
                        font-size: 20px;
                    }
                    .footer ul {
                        margin: 0;
                        padding: 0;
                    }
                    .footer ul li {
                        list-style: none;
                        margin-bottom: 10px;
                    }
                    .footer ul li a {
                        color: rgba(255, 255, 255, 1);
                    }
        
                    @media screen and (max-width: 500px) {
                    }
                </style>
            </head>
            <body
                width="100%"
                style="
                    margin: 0;
                    padding: 0 !important;
                    mso-line-height-rule: exactly;
                    background-color: #222222;
                "
            >
                <center style="width: 100%; background-color: #f1f1f1">
                    <div
                        style="max-width: 600px; margin: 0 auto"
                        class="email-container"
                    >
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                            class="bg_white"
                        >
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <table
                                        role="presentation"
                                        border="0"
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                    >
                                        <tr>
                                            <td class="logo" style="text-align: left">
                                                <img
                                                    width="40%"
                                                    src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                                />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <table>
                                    <tr>
                                        <td
                                            valign="top"
                                            class="bg_white"
                                            style="padding: 1em 2.5em"
                                        >
                                            <h4>
                                                Kepada Yth. Bapak/Ibu ${requestor} <br />
                                                Permintaan registrasi vendor anda telah
                                                dibuat dengan nomor ticket ${ticket_num}
                                            </h4>
                                        </td>
                                    </tr>
                                </table>
                            </tr>
                        </table>
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                        >
                            <tr>
                                <td
                                    valign="middle"
                                    class="bg_black footer email-section"
                                >
                                    <table>
                                        <tr>
                                            <td>KPN Corp Copyright 2023</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>
                </center>
            </body>
        </html>
        `;
    },

    approve: (ven_code, ven_name) => {
        return `<!doctype html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width" />
                <title>Email Notification</title>
                <link
                    href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
                    rel="stylesheet"
                />
                <style>
                    html,
                    body {
                        margin: 0 auto !important;
                        padding: 0 !important;
                        height: 100% !important;
                        width: 100% !important;
                        background: #f1f1f1;
                    }
        
                    /* What it does: Stops email clients resizing small text. */
                    * {
                        -ms-text-size-adjust: 100%;
                        -webkit-text-size-adjust: 100%;
                    }
        
                    /* What it does: Centers email on Android 4.4 */
                    div[style*="margin: 16px 0"] {
                        margin: 0 !important;
                    }
        
                    /* What it does: Stops Outlook from adding extra spacing to tables. */
                    table,
                    td {
                        mso-table-lspace: 0pt !important;
                        mso-table-rspace: 0pt !important;
                    }
        
                    /* What it does: Fixes webkit padding issue. */
                    table {
                        border-spacing: 0 !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                        margin: 0 auto !important;
                    }
        
                    /* What it does: Uses a better rendering method when resizing images in IE. */
                    img {
                        -ms-interpolation-mode: bicubic;
                    }
        
                    /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
                    a {
                        text-decoration: none;
                    }
        
                    /* What it does: A work-around for email clients meddling in triggered links. */
                    *[x-apple-data-detectors],  /* iOS */
                .unstyle-auto-detected-links *,
                .aBn {
                        border-bottom: 0 !important;
                        cursor: default !important;
                        color: inherit !important;
                        text-decoration: none !important;
                        font-size: inherit !important;
                        font-family: inherit !important;
                        font-weight: inherit !important;
                        line-height: inherit !important;
                    }
        
                    /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
                    .a6S {
                        display: none !important;
                        opacity: 0.01 !important;
                    }
        
                    /* What it does: Prevents Gmail from changing the text color in conversation threads. */
                    .im {
                        color: inherit !important;
                    }
        
                    /* If the above doesn't work, add a .g-img class to any image in question. */
                    img.g-img + div {
                        display: none !important;
                    }
        
                    /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
                    /* Create one of these media queries for each additional viewport size you'd like to fix */
        
                    /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
                    @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                        u ~ div .email-container {
                            min-width: 320px !important;
                        }
                    }
                    /* iPhone 6, 6S, 7, 8, and X */
                    @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                        u ~ div .email-container {
                            min-width: 375px !important;
                        }
                    }
                    /* iPhone 6+, 7+, and 8+ */
                    @media only screen and (min-device-width: 414px) {
                        u ~ div .email-container {
                            min-width: 414px !important;
                        }
                    }
                </style>
        
                <!-- CSS Reset : END -->
        
                <!-- Progressive Enhancements : BEGIN -->
                <style>
                    .primary {
                        background: #2f89fc;
                    }
                    .bg_white {
                        background: #ffffff;
                    }
                    .bg_light {
                        background: #fafafa;
                    }
                    .bg_black {
                        background: #000000;
                    }
                    .bg_dark {
                        background: rgba(0, 0, 0, 0.8);
                    }
                    .email-section {
                        padding: 2.5em;
                    }
        
                    /*BUTTON*/
                    .btn {
                        padding: 5px 15px;
                        display: inline-block;
                    }
                    .btn.btn-primary {
                        border-radius: 5px;
                        background: #2f89fc;
                        color: #ffffff;
                    }
                    .btn.btn-white {
                        border-radius: 5px;
                        background: #ffffff;
                        color: #000000;
                    }
                    .btn.btn-white-outline {
                        border-radius: 5px;
                        background: transparent;
                        border: 1px solid #fff;
                        color: #fff;
                    }
        
                    h1,
                    h2,
                    h3,
                    h4,
                    h5,
                    h6 {
                        font-family: "Montserrat", sans-serif;
                        color: #000000;
                        margin-top: 0;
                        font-weight: 400;
                    }

                    h4 span.approved {
                        color: green;
                        font-weight: 700;
                    }
        
                    body {
                        font-family: "Montserrat", sans-serif;
                        font-weight: 400;
                        font-size: 15px;
                        line-height: 1.8;
                        color: #000000;
                    }
        
                    a {
                        color: #2f89fc;
                    }
        
                    table {
                    }
                    /*LOGO*/
        
                    .logo h1 {
                        margin: 0;
                    }
                    .logo h1 a {
                        color: #000000;
                        font-size: 20px;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-family: "Montserrat", sans-serif;
                    }
        
                    .navigation {
                        padding: 0;
                    }
                    .navigation li {
                        list-style: none;
                        display: inline-block;
                        margin-left: 5px;
                        font-size: 13px;
                        font-weight: 500;
                    }
                    .navigation li a {
                        color: rgba(0, 0, 0, 0.4);
                    }
        
                    /*HEADING SECTION*/
                    .heading-section {
                    }
                    .heading-section h2 {
                        color: #000000;
                        font-size: 28px;
                        margin-top: 0;
                        line-height: 1.4;
                        font-weight: 400;
                    }
                    .heading-section .subheading {
                        margin-bottom: 20px !important;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(0, 0, 0, 0.4);
                        position: relative;
                    }
                    .heading-section .subheading::after {
                        position: absolute;
                        left: 0;
                        right: 0;
                        bottom: -10px;
                        content: "";
                        width: 100%;
                        height: 2px;
                        background: #2f89fc;
                        margin: 0 auto;
                    }
        
                    .heading-section-white {
                        color: rgba(255, 255, 255, 0.8);
                    }
                    .heading-section-white h2 {
                        line-height: 1;
                        padding-bottom: 0;
                    }
                    .heading-section-white h2 {
                        color: #ffffff;
                    }
                    .heading-section-white .subheading {
                        margin-bottom: 0;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(255, 255, 255, 0.4);
                    }
        
                    /*FOOTER*/
        
                    .footer {
                        color: rgba(255, 255, 255, 0.5);
                    }
                    .footer .heading {
                        color: #ffffff;
                        font-size: 20px;
                    }
                    .footer ul {
                        margin: 0;
                        padding: 0;
                    }
                    .footer ul li {
                        list-style: none;
                        margin-bottom: 10px;
                    }
                    .footer ul li a {
                        color: rgba(255, 255, 255, 1);
                    }
        
                    @media screen and (max-width: 500px) {
                    }
                </style>
            </head>
            <body
                width="100%"
                style="
                    margin: 0;
                    padding: 0 !important;
                    mso-line-height-rule: exactly;
                    background-color: #222222;
                "
            >
                <center style="width: 100%; background-color: #f1f1f1">
                    <div
                        style="max-width: 600px; margin: 0 auto"
                        class="email-container"
                    >
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                            class="bg_white"
                        >
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <table
                                        role="presentation"
                                        border="0"
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                    >
                                        <tr>
                                            <td class="logo" style="text-align: left">
                                                <img
                                                    width="40%"
                                                    src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                                />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <table>
                                    <tr>
                                        <td
                                            valign="top"
                                            class="bg_white"
                                            style="padding: 1em 2.5em"
                                        >
                                            <h4>
                                                Kepada Yth. Bapak/Ibu <br />
                                                Permintaan registrasi vendor anda adalah <span class="approved">Approved</span> dengan detail
                                                sebagai berikut :
                                                <br />
                                                <br />
                                                ${ven_code} - ${ven_name}
                                            </h4>
                                        </td>
                                    </tr>
                                </table>
                            </tr>
                        </table>
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                        >
                            <tr>
                                <td
                                    valign="middle"
                                    class="bg_black footer email-section"
                                >
                                    <table>
                                        <tr>
                                            <td>KPN Corp Copyright 2023</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>
                </center>
            </body>
        </html>`;
    },

    reject: remarks => {
        return `<!doctype html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width" />
                <title>Email Notification</title>
                <link
                    href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
                    rel="stylesheet"
                />
                <style>
                    html,
                    body {
                        margin: 0 auto !important;
                        padding: 0 !important;
                        height: 100% !important;
                        width: 100% !important;
                        background: #f1f1f1;
                    }
        
                    /* What it does: Stops email clients resizing small text. */
                    * {
                        -ms-text-size-adjust: 100%;
                        -webkit-text-size-adjust: 100%;
                    }
        
                    /* What it does: Centers email on Android 4.4 */
                    div[style*="margin: 16px 0"] {
                        margin: 0 !important;
                    }
        
                    /* What it does: Stops Outlook from adding extra spacing to tables. */
                    table,
                    td {
                        mso-table-lspace: 0pt !important;
                        mso-table-rspace: 0pt !important;
                    }
        
                    /* What it does: Fixes webkit padding issue. */
                    table {
                        border-spacing: 0 !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                        margin: 0 auto !important;
                    }
        
                    /* What it does: Uses a better rendering method when resizing images in IE. */
                    img {
                        -ms-interpolation-mode: bicubic;
                    }
        
                    /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
                    a {
                        text-decoration: none;
                    }
        
                    /* What it does: A work-around for email clients meddling in triggered links. */
                    *[x-apple-data-detectors],  /* iOS */
                .unstyle-auto-detected-links *,
                .aBn {
                        border-bottom: 0 !important;
                        cursor: default !important;
                        color: inherit !important;
                        text-decoration: none !important;
                        font-size: inherit !important;
                        font-family: inherit !important;
                        font-weight: inherit !important;
                        line-height: inherit !important;
                    }
        
                    /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
                    .a6S {
                        display: none !important;
                        opacity: 0.01 !important;
                    }
        
                    /* What it does: Prevents Gmail from changing the text color in conversation threads. */
                    .im {
                        color: inherit !important;
                    }
        
                    /* If the above doesn't work, add a .g-img class to any image in question. */
                    img.g-img + div {
                        display: none !important;
                    }
        
                    /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
                    /* Create one of these media queries for each additional viewport size you'd like to fix */
        
                    /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
                    @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                        u ~ div .email-container {
                            min-width: 320px !important;
                        }
                    }
                    /* iPhone 6, 6S, 7, 8, and X */
                    @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                        u ~ div .email-container {
                            min-width: 375px !important;
                        }
                    }
                    /* iPhone 6+, 7+, and 8+ */
                    @media only screen and (min-device-width: 414px) {
                        u ~ div .email-container {
                            min-width: 414px !important;
                        }
                    }
                </style>
        
                <!-- CSS Reset : END -->
        
                <!-- Progressive Enhancements : BEGIN -->
                <style>
                    .primary {
                        background: #2f89fc;
                    }
                    .bg_white {
                        background: #ffffff;
                    }
                    .bg_light {
                        background: #fafafa;
                    }
                    .bg_black {
                        background: #000000;
                    }
                    .bg_dark {
                        background: rgba(0, 0, 0, 0.8);
                    }
                    .email-section {
                        padding: 2.5em;
                    }
        
                    /*BUTTON*/
                    .btn {
                        padding: 5px 15px;
                        display: inline-block;
                    }
                    .btn.btn-primary {
                        border-radius: 5px;
                        background: #2f89fc;
                        color: #ffffff;
                    }
                    .btn.btn-white {
                        border-radius: 5px;
                        background: #ffffff;
                        color: #000000;
                    }
                    .btn.btn-white-outline {
                        border-radius: 5px;
                        background: transparent;
                        border: 1px solid #fff;
                        color: #fff;
                    }
        
                    h1,
                    h2,
                    h3,
                    h4,
                    h5,
                    h6 {
                        font-family: "Montserrat", sans-serif;
                        color: #000000;
                        margin-top: 0;
                        font-weight: 400;
                    }

                    h4 span.rejected {
                        color: red;
                        font-weight: 700;
                    }
        
                    body {
                        font-family: "Montserrat", sans-serif;
                        font-weight: 400;
                        font-size: 15px;
                        line-height: 1.8;
                        color: #000000;
                    }
        
                    a {
                        color: #2f89fc;
                    }
        
                    table {
                    }
                    /*LOGO*/
        
                    .logo h1 {
                        margin: 0;
                    }
                    .logo h1 a {
                        color: #000000;
                        font-size: 20px;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-family: "Montserrat", sans-serif;
                    }
        
                    .navigation {
                        padding: 0;
                    }
                    .navigation li {
                        list-style: none;
                        display: inline-block;
                        margin-left: 5px;
                        font-size: 13px;
                        font-weight: 500;
                    }
                    .navigation li a {
                        color: rgba(0, 0, 0, 0.4);
                    }
        
                    /*HEADING SECTION*/
                    .heading-section {
                    }
                    .heading-section h2 {
                        color: #000000;
                        font-size: 28px;
                        margin-top: 0;
                        line-height: 1.4;
                        font-weight: 400;
                    }
                    .heading-section .subheading {
                        margin-bottom: 20px !important;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(0, 0, 0, 0.4);
                        position: relative;
                    }
                    .heading-section .subheading::after {
                        position: absolute;
                        left: 0;
                        right: 0;
                        bottom: -10px;
                        content: "";
                        width: 100%;
                        height: 2px;
                        background: #2f89fc;
                        margin: 0 auto;
                    }
        
                    .heading-section-white {
                        color: rgba(255, 255, 255, 0.8);
                    }
                    .heading-section-white h2 {
                        line-height: 1;
                        padding-bottom: 0;
                    }
                    .heading-section-white h2 {
                        color: #ffffff;
                    }
                    .heading-section-white .subheading {
                        margin-bottom: 0;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(255, 255, 255, 0.4);
                    }
        
                    /*FOOTER*/
        
                    .footer {
                        color: rgba(255, 255, 255, 0.5);
                    }
                    .footer .heading {
                        color: #ffffff;
                        font-size: 20px;
                    }
                    .footer ul {
                        margin: 0;
                        padding: 0;
                    }
                    .footer ul li {
                        list-style: none;
                        margin-bottom: 10px;
                    }
                    .footer ul li a {
                        color: rgba(255, 255, 255, 1);
                    }
        
                    @media screen and (max-width: 500px) {
                    }
                </style>
            </head>
            <body
                width="100%"
                style="
                    margin: 0;
                    padding: 0 !important;
                    mso-line-height-rule: exactly;
                    background-color: #222222;
                "
            >
                <center style="width: 100%; background-color: #f1f1f1">
                    <div
                        style="max-width: 600px; margin: 0 auto"
                        class="email-container"
                    >
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                            class="bg_white"
                        >
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <table
                                        role="presentation"
                                        border="0"
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                    >
                                        <tr>
                                            <td class="logo" style="text-align: left">
                                                <img
                                                    width="40%"
                                                    src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                                />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <table>
                                    <tr>
                                        <td
                                            valign="top"
                                            class="bg_white"
                                            style="padding: 1em 2.5em"
                                        >
                                            <h4>
                                                Kepada Yth. Bapak/Ibu <br />
                                                Permintaan registrasi vendor anda adalah <span class="rejected">Rejected</span> dengan detail
                                                sebagai berikut :
                                                <br />
                                                <br />
                                                ${remarks} 
                                            </h4>
                                        </td>
                                    </tr>
                                </table>
                            </tr>
                        </table>
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                        >
                            <tr>
                                <td
                                    valign="middle"
                                    class="bg_black footer email-section"
                                >
                                    <table>
                                        <tr>
                                            <td>KPN Corp Copyright 2023</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>
                </center>
            </body>
        </html>`;
    },
};

module.exports = Email;
