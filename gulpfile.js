/**********VARIABLES EN FONCTION DU SITE**********/

const theme_folder = 'themes/tb_selest/'; // Le nom du Dossier du th�me
const	estProd = false; // CHOIX SERVEUR : false = DEV / true = prod

// GONFIGURATION SERVEUR DEV
var domain_site = '', // Le nom de domaine du site
    dossier_site = '', // G�n�ralement le nom de domaine du site
    remote_host = '', // SSH server
    remote_user = '', // SSH user
    platform = '', // Num�ro de plateforme
    estHttps = false; // Indique si le site � la connexion s�curis�e

// GONFIGURATION SERVEUR PROD
if (estProd){
    domain_site = '';
    dossier_site = domain_site;
    remote_host = '';
    remote_user = '';
    platform = '';
    estHttps = true;
}

/**********VARIABLES FIXES - NE JAMAIS MODIFIER**********/

// PAQUETS REQUIS
const
    gulp = require('gulp'),
    sass = require('gulp-sass'),

// VARIABLES DU SITE
    remote_folder = '/static/'+platform+'/sites/'+dossier_site+'/',
    dest = theme_folder+'',
    watch_paths  = [
        theme_folder + '**/*',
        '!' + theme_folder + 'css/*',
        '!' + theme_folder + 'scss/**/*',
    ];

// VERIFICATION SI HTTPS EST ACTIF
switch (estHttps) {
    case true:
        url_site = 'https://'+domain_site+'/';
        break;
    default:
        url_site = 'http://'+domain_site+'/';
}

// INITIALISATION BROWSERSYNC
browserSync.init({
    injectChanges: false,
    proxy: url_site,
    https: estHttps
});

// ENVOI AUTOMATIQUE DES FICHIERS
gulp.task('envoi', function () {
    gulp
        .src(watch_paths)
        .pipe(changed(dest))
        .pipe(gulp.dest(dest))
        .pipe(sftp({
            host: remote_host,
            user: remote_user,
            remotePath: (remote_folder + theme_folder)
        }))
        .pipe(browserSync.stream());
});

// ENVOI AUTOMATIQUE DES JAVASCRIPTS
gulp.task('js:lint', function () {
    gulp
        .src(theme_folder + 'js/*.js')
        .pipe(eslint())
        .pipe(eslint.format())
    // .pipe(eslint.failAfterError())
});

// COMPILATION SCSS
const sassOptions = {
    errLogToConsole: true,
    outputStyle: 'compressed'
};

gulp.task('sass', function () {
    gulp
        .src(theme_folder + 'scss/global.scss')
        .pipe(stylelint({
            failAfterError: false,
            reporters: [
                {formatter: 'verbose', console: true}
            ],
            debug: true
        }))
        .pipe(sourcemaps.init())
        .pipe(sass(sassOptions).on('error', sass.logError))
        .pipe(autoprefixer({browsers: ['last 2 versions', 'ie 11']}))
        .pipe(sourcemaps.write(''))
        .pipe(gulp.dest(theme_folder + 'css'))
        .pipe(sftp({
            host: remote_host,
            user: remote_user,
            remotePath: (remote_folder + theme_folder + 'css')
        }))
        .pipe(browserSync.stream())
});

// SURVEILLANCE DES FICHIERS
gulp.task('watch', function() {
    gulp.watch(watch_paths, gulp.parallel('envoi', 'watch'));
    gulp.watch(theme_folder + 'js/*.js', gulp.parallel('js:lint', 'envoi', 'watch'));
    gulp.watch(theme_folder + 'scss/**/*', gulp.parallel('sass', 'watch'));
});

gulp.task('default',
    gulp.series('watch')
);
