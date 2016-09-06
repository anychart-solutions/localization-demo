(function () {
    var chart;
    var text_doc = document.documentElement.innerHTML;
    var array_url = [];
    var chart_container = 'server-status-chart';
    var data = serverStatusData();
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
                var format = $('.date-pattern').find('td.active').text();

                clearInterval(timerId);
                disposeChart();
                createChart(data, chart_container, code, format);
            }
        }
    }

    function changeDatePattern(format, flag) {
        var locale = anychart.format.outputLocale();

        disposeChart();
        createChart(data, chart_container, locale, format);
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

    function createChart(data, container, locale, format) {
        var date_format = 'EEEE, dd MMMM yyyy - hh:mm';

        if (format) {
            date_format = format;
        }
        // create data tree on our data
        var treeData = anychart.data.tree(data, anychart.enums.TreeFillingMethod.AS_TABLE);

        // set a localization for output
        anychart.format.outputLocale(locale);
        anychart.format.outputDateTimeFormat(date_format);

        // create project gantt chart
        chart = anychart.ganttResource();
        // set data for the chart
        chart.data(treeData);
        // set start splitter position settings
        chart.splitterPosition(110);

        // get chart data grid link to set column settings
        var dataGrid = chart.dataGrid();
        dataGrid.column(0).enabled(false);

        // set first column settings
        var firstColumn = dataGrid.column(1);
        firstColumn.title('Server');
        firstColumn.width(110);
        firstColumn.cellTextSettings().hAlign('left');
        firstColumn.textFormatter(function (item) {
            return item.get('name');
        });
        firstColumn.cellTextSettingsOverrider(labelTextSettingsOverrider);

        // set second column settings
        var secondColumn = dataGrid.column(2);
        secondColumn.title('Online');
        secondColumn.width(60);
        secondColumn.cellTextSettings().hAlign('right');
        secondColumn.textFormatter(function (item) {
            return item.get('online') || '';
        });
        secondColumn.cellTextSettingsOverrider(labelTextSettingsOverrider);

        // set third column settings
        var thirdColumn = dataGrid.column(3);
        thirdColumn.title('Maintenance');
        thirdColumn.width(60);
        thirdColumn.cellTextSettings().hAlign('right');
        thirdColumn.textFormatter(function (item) {
            return item.get('maintenance') || '';
        });
        thirdColumn.cellTextSettingsOverrider(labelTextSettingsOverrider);

        // set fourth column settings
        var fourthColumn = dataGrid.column(4);
        fourthColumn.title('Offline');
        fourthColumn.width(60);
        fourthColumn.cellTextSettings().hAlign('right');
        fourthColumn.textFormatter(function (item) {
            return item.get('offline') || '';
        });
        fourthColumn.cellTextSettingsOverrider(labelTextSettingsOverrider);

        // set container id for the chart
        chart.container(container);
        // initiate chart drawing
        chart.draw();

        function labelTextSettingsOverrider(label, item) {
            switch (item.get('type')) {
                case 'online':
                    label.fontColor('#70B7DD').fontWeight('bold');
                    break;
                case 'offline':
                    label.fontColor('#E24B26').fontWeight('bold');
                    break;
                case 'maintenance':
                    label.fontColor('#FFA500').fontWeight('bold');
                    break;
            }
        }
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