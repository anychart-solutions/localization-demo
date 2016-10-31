(function () {
    var chart;
    var product = $('body').data('product');
    var chart_container = 'acme-chart';
    var $date_pattern = $('.date-pattern');
    var default_format = 'EEEE, dd MMMM yyyy';
    formats = {};

    function hidePreloader() {
        $('#loader-wrapper').fadeOut('slow', function () {
            scrollPosition();
        });
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

                data['anychart-locales'].locales.sort(function (a, b) {
                    return a['englishName'].localeCompare(b['englishName']);
                });

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
                $table.find('td[data-code="en-us"]').trigger('click');
            }
        });
    }

    function getDateTimePattern(code) {
        var url = 'formats/' + code + '.js';

        loadScript(url, changePattern, code);
    }

    function changePattern(code) {
        var $table = $date_pattern.find('tbody');
        $table.empty();

        for (var i = 0; i < formats[code].length; i++) {
            $table.append(
                '<tr>' + '<td>' + formats[code][i] + '</td>' + '</tr>'
            );
        }

        askEventDatePattern();
    }

    function loadScript(url, callback, code) {
        var $body = $('body');
        var script = document.createElement('script');
        var el = 'script[src="' + url + '"]';

        script.src = url;

        if ($(el).length === 0) {
            $(script).attr('defer', 'defer');
            $body.find('#js_common').before(script);
        }
        script.onload = callback(code);

        displayLocaleJSON(url);
        displayFormatArray(url, code);
        displayFullSource(code);
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

    function displayFullSource(locale, input_format) {
        var $lang_mark = $('.language-markup');
        var format = input_format || $date_pattern.find('td.active').text() || default_format;
        var code_func = createChart.toString()
            .replace('function createChart(container, locale, format) {', '')
            .replace(/}$/, '')
            .trim();
        var code = 'anychart.onDocumentReady(function () {\n\t\tvar format ="' + format + '";\n' +
            '\t\tvar locale = "' + locale + '";\n\t\t' + code_func + '\n\t\t});';
        var doc = '<!DOCTYPE html>\n<html lang="en">\n<head>' +
            '\n\t<meta charset="utf-8" />' +
            '\n\t<script src="http://anychart.stg/products/anygantt/demos/localization/repo/anychart-bundle.min.js"></script>' +
            '\n\t<script src="' + 'https://cdn.anychart.com/locale/1.1.0/' + locale + '.js"></script>' +
            '\n</head>\n<body>' +
            '\n\t<div id="container" style="width: 850px; height: 600px; margin: 0 auto;"></div>' +
            '\n\t<script>\n\t\t' + code +
            '\n\t</script>\n</body>\n</html>';

        $lang_mark.text(doc);
        Prism.highlightElement($lang_mark[0]);
    }

    function disposeChart() {
        if (chart) {
            chart.dispose();
            chart = null;
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
                var format = $date_pattern.find('td.active').text() || default_format;

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
        displayFullSource(locale, format);
    }

    function askEventLanguageLocale() {
        $('.language-locale').find('td').on('click', function () {
            var $that = $(this);
            var url = $that.attr('data-locale-src');
            var code = $that.attr('data-code');

            loadScript(url, changeLocale, code);
            getDateTimePattern(code);
            activeEl($that);
        });
    }

    function askEventDatePattern() {
        $date_pattern.find('td').on('click', function () {
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
        var data = [
            ['Jan 2015', 22, 43, 75],
            ['Feb 2015', 34, 45, 56],
            ['Mar 2015', 16, 26, 67],
            ['Apr 2015', 12, 86, 42],
            ['May 2015', 41, 35, 17],
            ['Jun 2015', 47, 31, 12],
            ['Jul 2015', 39, 27, 9],
            ['Aug 2015', 28, 16, 23],
            ['Sep 2015', 21, 27, 47],
            ['Oct 2015', 18, 31, 58],
            ['Nov 2015', 24, 42, 69],
            ['Dec 2015', 29, 39, 71]
        ];

        var _title = 'ACME corp. Problems During the Year\n' + 'From: ' +
            anychart.format.dateTime(data[0][0], format, -8 * 60, locale) +
            '\nTo: ' + anychart.format.dateTime(data[data.length - 1][0], format, -8 * 60, locale);

        // Set a localization for output.
        anychart.format.outputLocale(locale);
        // create data set on our data, also we can put data directly to series
        var dataSet = anychart.data.set(data);

        // map data for the first series, take value from first column of data set
        var seriesData_1 = dataSet.mapAs({x: [0], value: [1]});

        // map data for the second series, take value from second column of data set
        var seriesData_2 = dataSet.mapAs({x: [0], value: [2]});

        // map data for the third series, take x from the zero column and value from the third column of data set
        var seriesData_3 = dataSet.mapAs({x: [0], value: [3]});

        // create line chart
        chart = anychart.line();
        // turn on the crosshair and tune it
        chart.crosshair().enabled(true).yLabel().enabled(false);
        chart.crosshair().enabled(true).xLabel().enabled(false);
        chart.crosshair().enabled(true).yStroke(null);
        // disable one of the chart grids
        chart.grid(0).enabled(false);
        // set chart title text settings
        chart.title(_title).padding([20, 0, 10, 0]);
        // set yAxis title
        chart.yAxis().title('Occurences per month');

        /** Helper Function to setup series
         *  @param series - stroke color
         *  @param name - stroke series name
         */
        var seriesConfiguration = function (series, name) {
            series.name(name);
            series.hoverMarkers().enabled(true).size(4);
        };

        // temp variable to store series instance
        var series;

        // setup first series
        series = chart.line(seriesData_1);
        series.stroke('#7CC0F7');
        seriesConfiguration(series, 'Purchase Returns');

        // setup second series
        series = chart.line(seriesData_2);
        series.stroke('#3C8AD8');
        seriesConfiguration(series, 'Delivery Failure');

        // setup third series
        series = chart.line(seriesData_3);
        series.stroke('#F18126');
        seriesConfiguration(series, 'Order Cancellation');

        // turn the legend on
        chart.legend().enabled(true).padding([0, 0, 10, 0]);

        chart.xAxis().labels().textFormatter(function () {
            return anychart.format.dateTime(this.value, 'MMM', -8 * 60, locale);
        });
        chart.tooltip().titleFormatter(function () {
            return anychart.format.dateTime(this.points[0].x, format, -8 * 60, locale);
        });

        chart.tooltip().textFormatter(function () {
            return this.points[0].seriesName + ': ' + this.points[0].value +
                '\n' + this.points[1].seriesName + ': ' + this.points[1].value +
                '\n' + this.points[2].seriesName + ': ' + this.points[2].value;
        });
        // set container id for the chart
        chart.container(container);
        // initiate chart drawing
        chart.draw();
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

    function scrollPosition() {
        var $language_locale = $('.language-locale');
        var top = $language_locale.find('.active').offset().top -
            $language_locale.height() / 2 + $language_locale.find('.active').height() / 2;

        $language_locale.animate({
            scrollTop: top
        }, 500);
    }

    function placeBlocks() {
        var mq = window.matchMedia('(max-width: 768px)');

        if (mq.matches) {
            $('.preview-container').detach().insertAfter('.tables-container');
        } else {
            $('.tables-container').detach().insertAfter('.preview-container');
        }
    }

    /* Prism copy to clipbaord */
    $('pre.copytoclipboard').each(function () {
        $this = $(this);
        $button = $('<button></button>');
        $this.wrap('<div/>').removeClass('copytoclipboard');
        $wrapper = $this.parent();
        $wrapper.addClass('copytoclipboard-wrapper').css({position: 'relative'});
        $button.css({
            position: 'absolute',
            top: 10,
            right: 27,
            width: 55,
            height: 31
        }).appendTo($wrapper).addClass('copytoclipboard btn btn-default');

        var copyCode = new Clipboard('button.copytoclipboard', {
            target: function (trigger) {
                return trigger.previousElementSibling;
            }
        });
        copyCode.on('success', function (event) {
            event.clearSelection();
            $(event.trigger).addClass('copied');
            window.setTimeout(function () {
                $(event.trigger).removeClass('copied');
            }, 2000);
        });
        copyCode.on('error', function (event) {
            event.trigger.textContent = 'Press "Ctrl + C" to copy';
            window.setTimeout(function () {
                event.trigger.textContent = 'Copy';
            }, 2000);
        });
    });
})();
