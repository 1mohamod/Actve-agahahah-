
// ==== KEEP ALIVE SERVER ====
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('🚀 البوت شغال 24/7 👑');
});

app.listen(port, () => {
  console.log(`✅ Keep-alive server running on http://localhost:${port}`);
});
// ============================



const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// متغيرات لحفظ بيانات المستخدمين
const userApplications = new Map();

client.once('ready', () => {
    console.log(`✅ تم تشغيل البوت: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId === 'start_application') {
            // بدء اختبار التفعيل
            const embed = new EmbedBuilder()
                .setTitle('📝 اختبار التفعيل - رويال ستي')
                .setDescription('مرحباً بك في اختبار التفعيل!\n\n**السؤال الأول:**\nما اسمك الحقيقي وعمرك؟')
                .setColor('#FFD700')
                .setThumbnail('https://i.imgur.com/example.png')
                .setFooter({ text: 'رويال ستي | ROYAL CITY' });

            const modal = new ModalBuilder()
                .setCustomId('personal_info')
                .setTitle('المعلومات الشخصية');

            const nameInput = new TextInputBuilder()
                .setCustomId('real_name_age')
                .setLabel('اسمك الحقيقي وعمرك')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('مثال: أحمد، 20 سنة')
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
            modal.addComponents(firstActionRow);

            await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {
        const userId = interaction.user.id;
        
        if (interaction.customId === 'personal_info') {
            const realNameAge = interaction.fields.getTextInputValue('real_name_age');
            
            if (!userApplications.has(userId)) {
                userApplications.set(userId, {});
            }
            userApplications.get(userId).realNameAge = realNameAge;

            // السؤال الثاني
            const modal = new ModalBuilder()
                .setCustomId('character_info')
                .setTitle('معلومات الشخصية');

            const characterInput = new TextInputBuilder()
                .setCustomId('character_name_age')
                .setLabel('اسم شخصيتك وعمرها')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('مثال: خالد العلي، 25 سنة')
                .setRequired(true);

            const actionRow = new ActionRowBuilder().addComponents(characterInput);
            modal.addComponents(actionRow);

            await interaction.showModal(modal);
        }
        
        else if (interaction.customId === 'character_info') {
            const characterNameAge = interaction.fields.getTextInputValue('character_name_age');
            userApplications.get(userId).characterNameAge = characterNameAge;

            // السؤال الثالث
            const modal = new ModalBuilder()
                .setCustomId('character_story')
                .setTitle('قصة الشخصية');

            const storyInput = new TextInputBuilder()
                .setCustomId('character_backstory')
                .setLabel('قصة شخصيتك مع تاريخ الميلاد والسلبيات والإيجابيات')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('اكتب قصة شخصيتك بالتفصيل مع ذكر تاريخ الميلاد والسلبيات والإيجابيات...')
                .setRequired(true);

            const actionRow = new ActionRowBuilder().addComponents(storyInput);
            modal.addComponents(actionRow);

            await interaction.showModal(modal);
        }
        
        else if (interaction.customId === 'character_story') {
            const characterStory = interaction.fields.getTextInputValue('character_backstory');
            userApplications.get(userId).characterStory = characterStory;

            // بدء الأسئلة صح وخطأ
            const embed = new EmbedBuilder()
                .setTitle('❓ أسئلة صح وخطأ')
                .setDescription('**السؤال 1/8:**\nهل يحق لك تقتل عند الشقق؟')
                .setColor('#FF6B6B')
                .setFooter({ text: 'رويال ستي | اختر الإجابة الصحيحة' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('q1_true')
                        .setLabel('✅ صح')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('q1_false')
                        .setLabel('❌ خطأ')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }
        
        else if (interaction.customId.startsWith('situation_')) {
            const situationNumber = interaction.customId.split('_')[1];
            const answer = interaction.fields.getTextInputValue('situation_answer');
            
            if (!userApplications.get(userId).situations) {
                userApplications.get(userId).situations = {};
            }
            userApplications.get(userId).situations[situationNumber] = answer;

            if (situationNumber === '3') {
                // انتهاء جميع الأسئلة - إرسال النموذج
                await sendFinalApplication(interaction, userId);
            } else {
                // الانتقال للسؤال التالي
                const nextNumber = parseInt(situationNumber) + 1;
                await askSituationQuestion(interaction, nextNumber);
            }
        }
    }

    // معالجة إجابات صح وخطأ
    if (interaction.isButton() && interaction.customId.startsWith('q')) {
        const userId = interaction.user.id;
        const questionNum = parseInt(interaction.customId.split('_')[0].substring(1));
        const answer = interaction.customId.includes('true');
        
        if (!userApplications.get(userId).quizAnswers) {
            userApplications.get(userId).quizAnswers = {};
        }
        userApplications.get(userId).quizAnswers[questionNum] = answer;

        if (questionNum < 8) {
            await askNextQuestion(interaction, questionNum + 1);
        } else {
            // انتهاء الأسئلة صح وخطأ - بدء أسئلة المواقف
            await askSituationQuestion(interaction, 1);
        }
    }
});

async function askNextQuestion(interaction, questionNum) {
    const questions = [
        '',
        'هل يحق لك تقتل عند الشقق؟',
        'هل يحق لك تقتل عسكري في المركز؟',
        'هل يحق لك تتكلم وانت ميت؟',
        'هل يحق لك تخرج وانت ميت؟',
        'هل يحق لك الخروج من الرول عند الحاجة؟',
        'انا معي سلاح خفيف والعدو معه سلاح ثقيل يحق لي اقاوم؟',
        'يمدي استعمل قلتشات بدون ابلغ عنها؟',
        'يمدي اسأل عن شي معين خارج الماب مثلاً في السيرفر؟'
    ];

    const embed = new EmbedBuilder()
        .setTitle('❓ أسئلة صح وخطأ')
        .setDescription(`**السؤال ${questionNum}/8:**\n${questions[questionNum]}`)
        .setColor('#FF6B6B')
        .setFooter({ text: 'رويال ستي | اختر الإجابة الصحيحة' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`q${questionNum}_true`)
                .setLabel('✅ صح')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`q${questionNum}_false`)
                .setLabel('❌ خطأ')
                .setStyle(ButtonStyle.Danger)
        );

    await interaction.update({ embeds: [embed], components: [row] });
}

async function askSituationQuestion(interaction, questionNum) {
    const questions = [
        '',
        'اذا شفت شخص خرج عن الرول وش اسوي؟',
        'اذا شفت تخريب وش اسوي؟',
        'اذا شفت فساد رقابي وش اسوي؟'
    ];

    const modal = new ModalBuilder()
        .setCustomId(`situation_${questionNum}`)
        .setTitle(`سؤال الموقف ${questionNum}`);

    const answerInput = new TextInputBuilder()
        .setCustomId('situation_answer')
        .setLabel(questions[questionNum])
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('اكتب إجابتك هنا...')
        .setRequired(true);

    const actionRow = new ActionRowBuilder().addComponents(answerInput);
    modal.addComponents(actionRow);

    if (questionNum === 1) {
        await interaction.update({ 
            content: '📝 الآن سنبدأ بأسئلة المواقف...',
            embeds: [],
            components: []
        });
        setTimeout(async () => {
            await interaction.followUp({ 
                content: 'اضغط هنا لبدء أسئلة المواقف',
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('start_situations')
                            .setLabel('📝 بدء أسئلة المواقف')
                            .setStyle(ButtonStyle.Primary)
                    )
                ],
                ephemeral: true
            });
        }, 1000);
    } else {
        await interaction.showModal(modal);
    }
}

// معالجة زر بدء أسئلة المواقف
client.on('interactionCreate', async interaction => {
    if (interaction.isButton() && interaction.customId === 'start_situations') {
        const modal = new ModalBuilder()
            .setCustomId('situation_1')
            .setTitle('سؤال الموقف 1');

        const answerInput = new TextInputBuilder()
            .setCustomId('situation_answer')
            .setLabel('اذا شفت شخص خرج عن الرول وش اسوي؟')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('اكتب إجابتك هنا...')
            .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(answerInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    }
});

async function sendFinalApplication(interaction, userId) {
    const userData = userApplications.get(userId);
    
    // حساب درجة الاختبار
    const correctAnswers = [false, false, false, false, false, true, false, true]; // الإجابات الصحيحة
    let score = 0;
    
    for (let i = 1; i <= 8; i++) {
        if (userData.quizAnswers[i] === correctAnswers[i-1]) {
            score++;
        }
    }

    const embed = new EmbedBuilder()
        .setTitle('📋 نموذج طلب التفعيل - رويال ستي')
        .setColor('#00FF00')
        .addFields(
            { name: '👤 الاسم الحقيقي والعمر', value: userData.realNameAge, inline: false },
            { name: '🎭 اسم الشخصية وعمرها', value: userData.characterNameAge, inline: false },
            { name: '📖 قصة الشخصية', value: userData.characterStory.length > 1024 ? userData.characterStory.substring(0, 1021) + '...' : userData.characterStory, inline: false },
            { name: '📊 نتيجة الاختبار', value: `${score}/8 (${Math.round((score/8)*100)}%)`, inline: true },
            { name: '📅 تاريخ التقديم', value: new Date().toLocaleString('ar-SA'), inline: true }
        )
        .setFooter({ text: 'رويال ستي | ROYAL CITY' })
        .setTimestamp();

    // إضافة إجابات المواقف
    if (userData.situations) {
        embed.addFields(
            { name: '🔍 الموقف الأول', value: userData.situations['1'] || 'لم يتم الإجابة', inline: false },
            { name: '🔍 الموقف الثاني', value: userData.situations['2'] || 'لم يتم الإجابة', inline: false },
            { name: '🔍 الموقف الثالث', value: userData.situations['3'] || 'لم يتم الإجابة', inline: false }
        );
    }

    await interaction.update({
        content: '✅ تم إرسال طلبك بنجاح! سيتم مراجعته من قبل الإدارة.',
        embeds: [embed],
        components: []
    });

    // إرسال النموذج لقناة معينة (يمكن تغيير ID القناة)
    const channelId = 'CHANNEL_ID_HERE'; // ضع هنا ID القناة المطلوبة
    const channel = client.channels.cache.get(channelId);
    if (channel) {
        await channel.send({ embeds: [embed] });
    }
}

client.on('messageCreate', async message => {
    if (message.content === '!تفعيل') {
        const embed = new EmbedBuilder()
            .setTitle('🎮 مرحباً بك في رويال ستي')
            .setDescription('**للتفعيل في رويال ستي يرجى الالتزام بالأنظمة الموضحة:**\n\n' +
                          '⚠️ يمنع تكون خامل في التذكرة لمدة **25m**\n\n' +
                          '⚠️ يمنع الإزعاج بالمنشن\n\n' +
                          '⚠️ يجب تبادل الاحترام مع الإداري\n\n' +
                          '📋 يرجى الالتزام بالقوانين الموضحة أعلاه')
            .setColor('#FFD700')
            .setThumbnail('https://i.imgur.com/example.png')
            .setFooter({ text: 'ROYAL CITY' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('start_application')
                    .setLabel('🚀 بدء اختبار التفعيل')
                    .setStyle(ButtonStyle.Primary)
            );

        await message.reply({ embeds: [embed], components: [row] });
    }
});

// تشغيل البوت
client.login('YOUR_BOT_TOKEN_HERE');
