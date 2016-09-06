(function () {
    var map;
    var text_doc = document.documentElement.innerHTML;
    var array_url = [];
    var chart_container = 'map-chart';
    formats = {};

    function hidePreloader() {
        $('#loader-wrapper').fadeOut('slow');
    }

    function activeEl(el) {
        $(el).closest('table').find('td').removeClass('active');
        $(el).addClass('active');
    }

    function getLocaleText() {
        $.ajax({
            url: 'http://cdn.anychart.com/locale/1.1.0/index.json',
            success: function (json) {
                var data = json;
                var $table = $('.language-locale').find('tbody');
                var locale;

                for (var i = 0; i < data['anychart-locales'].locales.length; i++) {
                    locale = data['anychart-locales'].locales[i];
                    $table.append(
                        '<tr>' + '<td data-locale-src="' + locale.url +
                        '" data-code="' + locale.code +
                        '">' + locale.englishName + ' - ' + locale.nativeName +
                        '</td>' + '</tr>'
                    )
                }

                askEventLanguageLocale();
            }
        });
    }

    function getDateTimePattern(code) {
        var url = 'formats/' + code + '.js';

        loadScript(url, changePattern, code);
    }

    function changePattern(code) {
        var $table = $('.date-pattern').find('tbody');
        $table.empty();

        for (var i = 0; i < formats[code].length; i++) {
            $table.append(
                '<tr>' + '<td>' + formats[code][i] + '</td>' + '</tr>'
            );
        }

        askEventDatePattern();
    }

    function loadScript(url, callback, code) {
        var body = $('body')[0];
        var script = document.createElement('script');
        var el = 'script[src="' + url + '"]';
        array_url.unshift(url);
        script.src = url;

        if ($(el).length == 0) {
            body.appendChild(script);
        }

        if (callback.name === 'changeLocale') {
            script.onload = callback(code);
        } else if (callback.name === 'changePattern') {
            var done = false;
            script.onload = script.onreadystatechange = function () {
                if (!done && (!this.readyState ||
                    this.readyState === "loaded" || this.readyState === "complete")) {
                    done = true;

                    callback(code);
                    displayFormatArray(url, code);
                    displayFullSource(array_url);
                }
            };
        }

        displayLocaleJSON(url);
    }

    function displayLocaleJSON(url) {
        if (url.indexOf('formats') === -1) {
            $.ajax({
                url: url,
                success: function (source) {
                    var code = JSON.stringify(eval(source), null, '\t');
                    var $lang_json = $('#locale-json').find('.language-json');

                    $lang_json.text(code);
                    Prism.highlightElement($lang_json[0]);
                }
            });
        }
    }

    function displayFormatArray(url, code) {
        if (url.indexOf('formats') !== -1) {
            var $lang_js = $('#format-array').find('.language-javascript');
            var text = 'var formats = {};\n' + 'formats' + '[\'' + code + '\'] = ';
            var formats_text = formats[code].map(function (value, index) {
                if (index == 0) {
                    return '"' + value + '"'
                }
                return '\t\t\t\t\t"' + value + '"'
            });

            $lang_js.text(text + '[' + formats_text.join(',\n') + ']');
            Prism.highlightElement($lang_js[0]);
        }
    }

    function displayFullSource(url) {
        var $lang_mark = $('.language-markup');
        var new_text_doc = text_doc.substr(0, text_doc.indexOf('</body>'));

        for (var i = 0; i < array_url.length; i++) {
            if (new_text_doc.indexOf(url[i]) == -1) {
                new_text_doc += '\n';
                new_text_doc += '<script src="' + url[i] + '">' + '</script>';
            }
        }

        new_text_doc += '\n</body>';
        array_url = [];
        $lang_mark.text(new_text_doc);
        Prism.highlightElement($lang_mark[0]);
    }

    function disposeChart() {
        if (map) {
            map.dispose();
            map = null;
        }
    }

    function changeLocale(code) {
        if (typeof code === 'string') {
            if (anychart.format.outputLocale() != code) {
                var timerId = setInterval(reDrawChart, 50);
            }
        }

        function reDrawChart() {
            if (window['anychart']['format']['locales'][code] != undefined) {
                var format = $('.date-pattern').find('td.active').text();

                clearInterval(timerId);
                disposeChart();
                createChart(chart_container, code, format);
            }
        }
    }

    function changeDatePattern(format, flag) {
        var locale = anychart.format.outputLocale();

        disposeChart();
        createChart(chart_container, locale, format);
        changeInputFormat(format, flag);
    }

    function askEventLanguageLocale() {
        $('.language-locale').find('td').on('click', function () {
            var $that = $(this);
            var url = $that.attr('data-locale-src');
            var code = $that.attr('data-code');

            loadScript(url, changeLocale, code);
            getDateTimePattern(code);
            activeEl($that);
        }).first().trigger('click');
    }

    function askEventDatePattern() {
        $('.date-pattern').find('td').on('click', function () {
            var $that = $(this);

            activeEl($that);
            changeInputPattern($that.text());
            changeDatePattern($that.text());
        });
    }

    function changeInputPattern(pattern) {
        $('.format-pattern-input').val(pattern);
    }

    function changeInputFormat(format, flag) {
        var locale = anychart.format.outputLocale();
        var date = new Date();
        var pattern = anychart.format.dateTime(date, format, -8 * 60, locale);

        if (flag === undefined) {
            $('.format-input').val(pattern);
        } else {
            $('#custom-example-format-input').val(pattern)
        }
    }

    function createChart(container, locale, format) {
        var date_format = 'EEEE, dd MMMM yyyy - hh:mm';

        if (format) {
            date_format = format;
        }
        // Set a localization for output.
        anychart.format.outputLocale(locale);
        anychart.format.outputDateTimeFormat(date_format);

        // create data set
        var dataSet = anychart.data.set([
            {
                size: 8848,
                name: "Everest",
                label: {anchor: 'leftBottom', position: 'top'},
                summiters: 'Edmund Hillary, Tenzing Norgay',
                ascent: Date.UTC(1953, 5, 29),
                lat: 27.986065,
                long: 86.922623
            },
            {
                size: 8586,
                name: "Kangchenjunga",
                label: {anchor: 'rightTop', position: 'bottom'},
                summiters: 'George Band, Joe Brown',
                ascent: Date.UTC(1955, 5, 25),
                lat: 27.702491,
                long: 88.147535
            },
            {
                size: 8516,
                name: "Lhotse",
                label: {anchor: 'rightTop', position: 'left'},
                summiters: 'Fritz Luchsinger, Ernst Reiss',
                ascent: Date.UTC(1956, 5, 18),
                lat: 27.962637,
                long: 86.933615
            },
            {
                size: 8485,
                name: "Makalu",
                label: {anchor: 'left', position: 'right'},
                summiters: 'Jean Couzy, Lionel Terray',
                ascent: Date.UTC(1956, 5, 15),
                lat: 27.88931,
                long: 87.08862
            },
            {
                size: 8201,
                name: "Cho Oyu",
                summiters: 'Joseph Joechler, Pasang Dawa Lama,<br/>Herbert Tichy',
                ascent: Date.UTC(1954, 10, 19),
                lat: 28.094197,
                long: 86.660708
            },
            {
                size: 8167,
                name: "Dhaulagiri",
                summiters: 'Kurt Diemberger, Peter Diener,<br/>Nawang Dorje, Nima Dorje, Ernst Forrer, Albin Schelbert',
                ascent: Date.UTC(1960, 5, 13),
                lat: 28.69757,
                long: 83.49241
            },
            {
                size: 8163,
                name: "Manaslu",
                label: {anchor: 'left', position: 'right'},
                summiters: 'Toshio Imanishi, Gyalzen Norbu',
                ascent: Date.UTC(1956, 5, 9),
                lat: 28.54997,
                long: 84.559612
            },
            {
                size: 8091,
                name: "Annapurna",
                label: {anchor: 'rightTop', position: 'left'},
                height: 8091,
                summiters: 'Maurice Herzog, Louis Lachenal',
                ascent: Date.UTC(1960, 6, 3),
                lat: 28.596629,
                long: 83.819701
            }
        ]);

        // define settings for maps regions (regions bounds are not relevant for this data,
        // so let's make it less contrast)
        var customTheme = {
            "map": {
                'unboundRegions': {'enabled': true, 'fill': '#E1E1E1', 'stroke': '#D2D2D2'}
            }
        };
        anychart.theme(customTheme);

        // create map chart
        map = anychart.map();
        // set geodata using http://cdn.anychart.com/geodata/1.2.0/countries/nepal/nepal.js
        map.geoData(anychart.maps['nepal']);

        var title = map.title();
        title.enabled(true);
        title.useHtml(true);
        title.text('Eight-thousanders of Nepal with first-ascent date.');
        title.padding([20, 0, 0, 0]);

        // set chart bubble settings
        map.maxBubbleSize(7);
        map.minBubbleSize(3);

        //create bubble series
        var series = map.bubble(dataSet);
        series.fill('#1976d2 0.6');
        series.stroke('1 #1976d2 0.9');
        series.labels()
            .enabled(true)
            .anchor('right')
            .position('left')
            .offsetX(3)
            .padding(0)
            .fontColor('#212121')
            .useHtml(true)
            .textFormatter(function () {
                return anychart.format.dateTime(this.getDataValue('ascent'));
            });
        series.hoverLabels().fontWeight('bold');
        series.selectionMode("none");

        // set series tooltip settings
        series.tooltip({
            background: {fill: 'white', stroke: '#c1c1c1', corners: 3, cornerType: 'ROUND'},
            padding: [8, 13, 10, 13]
        });
        series.tooltip().textWrap('byLetter').useHtml(true);
        series.tooltip().title().fontColor('#7c868e').useHtml(true);

        series.tooltip().titleFormatter(function () {
            var span_for_value = ' (<span style="color: #545f69; font-size: 12px; font-weight: bold">';
            return this.getDataValue('name') + span_for_value + this.getDataValue('size') + '</span>m</strong>)';
        });
        series.tooltip().fontColor('#7c868e').textFormatter(function () {
            return 'First Ascent: <span style="color: #545f69; font-size: 12px">' +
                anychart.format.dateTime(this.getDataValue('ascent')) + '</span></strong><br/>' +
                'First Summiters: <span style="color: #545f69; font-size: 12px">' +
                this.getDataValue('summiters') + '</span></strong>';
        });

        //set series geo id field settings
        series.geoIdField('code_hasc');

        // set container id for the chart
        map.container(container);

        // initiate chart drawing
        map.draw();
    }

    anychart.onDocumentReady(function () {
        // event
        $('.tabs-control a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });

        $('#custom-format').find('.format-pattern-input').on('keyup', function () {
            changeDatePattern($(this).val(), true);
        });

        getLocaleText();
    });

    $(window).on('load', function () {
        placeBlocks();
        hidePreloader();
    });

    $(window).on('resize', function () {
        placeBlocks();
    });

    function placeBlocks() {
        var mq = window.matchMedia('(max-width: 768px)');

        if (mq.matches) {
            $('.preview-container').detach().insertAfter('.tables-container');
        } else {
            $('.tables-container').detach().insertAfter('.preview-container');
        }
    }
})();
