var gulp = require('gulp'),
    browserSync = require('browser-sync'), // Подключаем Browser Sync
    sass = require('gulp-sass'), //Подключаем Sass пакет
    replace = require('gulp-replace'),
    concat = require('gulp-concat'), // Подключаем gulp-concat (для конкатенации файлов)
    uglify = require('gulp-uglifyjs'), // Подключаем gulp-uglifyjs (для сжатия JS)
    cssnano = require('gulp-cssnano'), // Подключаем пакет для минификации CSS
    rename = require('gulp-rename'), // Подключаем библиотеку для переименования файлов
    del = require('del'), // Подключаем библиотеку для удаления файлов и папок
    imagemin = require('gulp-imagemin'), // Подключаем библиотеку для работы с изображениями
    pngquant = require('imagemin-pngquant'), // Подключаем библиотеку для работы с png
    cache = require('gulp-cache'), // Подключаем библиотеку кеширования
    autoprefixer = require('gulp-autoprefixer'), // Подключаем библиотеку для автоматического добавления префиксов
    pug = require('gulp-pug'),
    cssbeautify = require('gulp-cssbeautify'),
    notify = require("gulp-notify");

gulp.task('browser-sync', function() { // Создаем таск browser-sync
    browserSync({ // Выполняем browser Sync
        server: { // Определяем параметры сервера
            baseDir: 'app' // Директория для сервера - app
        },
        notify: false // Отключаем уведомления
    });
});

gulp.task('sass', function() { // Создаем таск Sass
    return gulp.src(['app/sass/**/*.scss', '!app/sass/**/_*.scss']) // Берем источник
        .pipe(sass()).on("error", notify.onError()) // Преобразуем Sass в CSS посредством gulp-sass
        .pipe(concat('styles.css'))
        .pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true })) // Создаем префиксы
        .pipe(cssbeautify({
            indent: '  ',
            openbrace: 'end-of-line',
            autosemicolon: false
        }))
        .pipe(gulp.dest('app/css')) // Выгружаем результата в папку app/css
        .pipe(browserSync.reload({ stream: true })) // Обновляем CSS на странице при изменении
});

gulp.task('css-libs', ['sass'], function() {
    return gulp.src('app/css/libs.css') // Выбираем файл для минификации
        .pipe(cssnano()) // Сжимаем
        .pipe(rename({ suffix: '.min' })) // Добавляем суффикс .min
        .pipe(gulp.dest('app/css')); // Выгружаем в папку app/css
});

gulp.task('pug', function() {
    gulp.src(['app/templates/**/*.pug', '!app/templates/**/_*.pug'])
        .pipe(pug({
            pretty: true
        })).on("error", notify.onError()) // Собираем Jade только в папке ./app/template/ исключая файлы с _*
        .on('error', console.log) // Если есть ошибки, выводим и продолжаем
        .pipe(gulp.dest('app/templates_html')) // Записываем собранные файлы
        .pipe(browserSync.reload({
            stream: true
        })) // даем команду на перезагрузку страницы
});

gulp.task('scripts', function() {
    return gulp.src([ // Берем все необходимые библиотеки
            'app/libs/jquery/dist/jquery.min.js', // Берем jQuery
            'app/libs/magnific-popup/dist/jquery.magnific-popup.min.js' // Берем Magnific Popup
        ])
        .pipe(concat('libs.min.js')) // Собираем их в кучу в новом файле libs.min.js
        .pipe(uglify()) // Сжимаем JS файл
        .pipe(gulp.dest('app/js')); // Выгружаем в папку app/js
});

gulp.task('bx', function() {
    return gulp.src('app/*.html')
        .pipe(replace(/src="([^"]*)"/g, 'src="<?=SITE_TEMPLATE_PATH?>/$1"')) // Bitrix
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({ stream: true }))
});

gulp.task('dj', function() {
    return gulp.src('app/*.html')
        .pipe(replace(/src="([^"]*)"/g, 'src="{% static \'$1\' %}"')) // Django
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({ stream: true }))
});


gulp.task('watch', ['browser-sync', 'css-libs', 'scripts'], function() {
    gulp.watch('app/sass/**/*.scss', ['sass']); // Наблюдение за sass файлами
    gulp.watch('app/templates/**/*.pug', ['pug']); // Наблюдение за pug файлами
    gulp.watch('app/*.html', browserSync.reload); // Наблюдение за HTML файлами в корне проекта
    gulp.watch('app/js/**/*.js', browserSync.reload); // Наблюдение за JS файлами в папке js
});

gulp.task('clean', function() {
    return del.sync('dist'); // Удаляем папку dist перед сборкой
});

gulp.task('img', function() {
    return gulp.src('app/img/**/*') // Берем все изображения из app
        .pipe(cache(imagemin({ // Сжимаем их с наилучшими настройками с учетом кеширования
            interlaced: true,
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }],
            use: [pngquant()]
        })))
        .pipe(gulp.dest('dist/img')); // Выгружаем на продакшен
});

gulp.task('build', ['clean', 'img', 'pug', 'sass', 'scripts'], function() {

    var buildCss = gulp.src([ // Переносим CSS стили в продакшен
            'app/css/styles.css',
            'app/css/libs.min.css'
        ])
        .pipe(gulp.dest('dist/css'))

    var buildFonts = gulp.src('app/fonts/**/*') // Переносим шрифты в продакшен
        .pipe(gulp.dest('dist/fonts'))

    var buildJs = gulp.src('app/js/**/*') // Переносим скрипты в продакшен
        .pipe(gulp.dest('dist/js'))

    var buildHtml = gulp.src('app/*.html') // Переносим HTML в продакшен
        .pipe(gulp.dest('dist'));

});

gulp.task('clear', function() {
    return cache.clearAll();
});

gulp.task('default', ['watch']);
