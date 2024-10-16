import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import excel from 'exceljs';
import usersService from '../../services/admin/users/user.service'
import bookSummaryService from '../../services/admin/book/bookSummary.service'
import transactionsService from '../../services/admin/users/transactions.service'

import { setColumnWidth, setHeaderBackgroundColor } from '../../lib/utils/utils';
import dailyDevotionalService from '../../services/admin/dailyDevotional/dailyDevotional.service';
import smallGroupService from '../../services/admin/smallGroup/smallGroup.service';
import expertCuratedService from '../../services/admin/book/expertCurated.service';
import fs from 'fs';
import path from 'path';
import { responseMessage } from '../../constants/message.constant';

const authControllerResponse = responseMessage.authControllerResponse


const exportData = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { selectedDataTypes } = request.body;
        const fileName = `export_data_${Date.now()}.xlsx`;
        const data : any[] = [];
        const workbook = new excel.Workbook();

        // Fetch data based on selected data types
        for (const dataType of selectedDataTypes) {
            switch (dataType) {
                case 'Daily devotional':
                    // Fetch reads of day data
                    const readsOfDayList = await dailyDevotionalService.getDailyDevotionalList();
                    data.push({ dataType, data: readsOfDayList });
                    break;
                case 'Curated list':
                    // Fetch curated list data
                    const curatedList = await expertCuratedService.getExpertCuratedList();
                    data.push({ dataType, data: curatedList });
                    break;
                case 'Books':
                    // Fetch book list data
                    const bookData = await bookSummaryService.getAllBookSummaries(0, 0, {}, { createdAt: -1 } );
                    const books = bookData.summaries
                    data.push({ dataType, data: books });
                    break;
                case 'Users':
                    // Fetch users data (if available)
                    const userData = await usersService.getAllUsersForExport();
                    data.push({ dataType, data: userData });
                    // Implement the logic to fetch users data
                    break;
                case 'Transactions':
                    // Fetch transactions data
                    const transactionList = await transactionsService.getTransactionsList();
                    data.push({ dataType, data: transactionList });
                    break;
                case 'Small group':
                    // Fetch small group data
                    const smallGroupList = await smallGroupService.getSmallGroupsList();
                    data.push({ dataType, data: smallGroupList });
                    break;
                case 'Most popular':
                    // Fetch most popular data
                    const bookList = await bookSummaryService.getAllBookSummaries(0, 0, { popular: true }, { createdAt: -1 });
                    const mostPopularList = bookList.summaries
                    data.push({ dataType, data: mostPopularList });
                    break;
                default:
                    break;
            }
        }

        // Generate Excel file
        const wsForDailyDevotional = workbook.addWorksheet('Daily devotional');
        const wsCuratedList = workbook.addWorksheet('Curated List')
        const wsSmallGroup = workbook.addWorksheet('Small group')
        const wsMostPopularBooks = workbook.addWorksheet('Most popular Books')
        const wsBooks = workbook.addWorksheet('Books')
        const wsTransactions = workbook.addWorksheet('Transactions')
        const wsUsers = workbook.addWorksheet('Users')

        /* set header */
        const dailyDevotionalExcelHeader = [
            { header: 'Title', key: 'title' },
            { header: 'SubTitle', key: 'subTitle' },
            { header: 'Video', key: 'video' },
            { header: 'Image', key: 'image' },
            { header: 'Status', key: 'status' },
            { header: 'Publish', key: 'publish' },
            { header: 'Created At', key: 'createdAt' },
        ];

        /* set header */
        const curatedExcelHeader = [
            { header: 'Title', key: 'title' },
            { header: 'Description', key: 'description' },
            { header: 'shortDescription', key: 'shortDescription' },
            { header: 'Views', key: 'views' },
            { header: 'Publish', key: 'publish' },
            { header: 'Image', key: 'image' },
            { header: 'Status', key: 'status' },
            { header: 'Created At', key: 'createdAt' },
            { header: 'Updated At', key: 'updatedAt' },
        ];

        /* set header */
        const smallGroupExcelHeader = [
            { header: 'Title', key: 'title' },
            { header: 'Publish', key: 'publish' },
            { header: 'Status', key: 'status' },
            { header: 'Description', key: 'description' },
            { header: 'Conclusion', key: 'conclusion' },
            { header: 'Introduction', key: 'introduction' },
            { header: 'Image', key: 'coverImage' },
            { header: 'IceBreaker', key: 'iceBreaker' },
            { header: 'Created At', key: 'createdAt' },
            { header: 'Updated At', key: 'updatedAt' },
        ];

        /* set header */
        const mostPopularBooksExcelHeader = [
            { header: 'Title', key: 'title' },
            { header: 'Description', key: 'description' },
            { header: 'Conclusion', key: 'overview' },
            { header: 'CoverImageBackground', key: 'coverImageBackground' },
            { header: 'Publish', key: 'publish' },
            { header: 'Image', key: 'coverImage' },
            { header: 'Status', key: 'status' },
            { header: 'BookReadFile', key: 'bookReadFile' },
            { header: 'Views', key: 'views' },
            { header: 'VideoFileSize', key: 'videoFileSize' },
            { header: 'BookFor', key: 'bookFor' },
            { header: 'Created At', key: 'createdAt' },
            { header: 'Updated At', key: 'updatedAt' },
        ];

        const booksExcelHeader = [
            { header: 'Title', key: 'title' },
            { header: 'Description', key: 'description' },
            { header: 'Conclusion', key: 'overview' },
            { header: 'CoverImageBackground', key: 'coverImageBackground' },
            { header: 'Publish', key: 'publish' },
            { header: 'Image', key: 'coverImage' },
            { header: 'Status', key: 'status' },
            { header: 'BookReadFile', key: 'bookReadFile' },
            { header: 'Views', key: 'views' },
            { header: 'VideoFileSize', key: 'videoFileSize' },
            { header: 'BookFor', key: 'bookFor' },
            { header: 'Created At', key: 'createdAt' },
            { header: 'Updated At', key: 'updatedAt' },
        ];

        const transactionsExcelHeader = [
            { header: 'UserId', key: 'userId' },
            { header: 'PaymentLink', key: 'paymentLink' },
            { header: 'Reason', key: 'reason' },
            { header: 'LatestInvoice', key: 'latestInvoice' },
            { header: 'Status', key: 'status' },
            { header: 'PaymentMethod', key: 'paymentMethod' },
            { header: 'Tax', key: 'tax' },
            { header: 'Total', key: 'total' },
            { header: 'Device', key: 'device' },
            { header: 'PlanCreatedAt', key: 'planCreatedAt' },
            { header: 'PlanExpiredAt', key: 'planExpiredAt' },
        ];

        const usersExcelHeader = [
            { header: 'FirstName', key: 'firstName' },
            { header: 'LastName', key: 'lastName' },
            { header: 'Email', key: 'email' },
            { header: 'Status', key: 'status' },
            { header: 'Image', key: 'image' },
            { header: 'Type', key: 'type' },
            { header: 'IsSignedUp', key: 'isSignedUp' },
            { header: 'Device', key: 'device' },
            { header : 'Country', key: 'country' },
            { header : 'TimeZone', key: 'timeZone' },
            { header: 'CreatedAt', key: 'createdAt' },
        ];
        wsForDailyDevotional.columns = dailyDevotionalExcelHeader;
        wsCuratedList.columns = curatedExcelHeader;
        wsSmallGroup.columns = smallGroupExcelHeader;
        wsMostPopularBooks.columns = mostPopularBooksExcelHeader
        wsBooks.columns = booksExcelHeader
        wsTransactions.columns = transactionsExcelHeader
        wsUsers.columns = usersExcelHeader

        // Add data to worksheet
        data.forEach(({ dataType, data }) => {
            data.forEach(item => {
                if (dataType === 'Daily devotional') {
                    wsForDailyDevotional.addRow([
                        item.title,
                        item.subTitle,
                        item.video,
                        item.image,
                        item.status,
                        item.publish,
                        item.createdAt,
                    ]);
                } else if (dataType === 'Curated list') {
                    wsCuratedList.addRow([
                        item.title,
                        item.description,
                        item.shortDescription,
                        item.views,
                        item.publish,
                        item.image,
                        item.status,
                        item.createdAt,
                        item.updatedAt, // Add displayAt column
                    ]);
                } else if (dataType === 'Small group') {
                    wsSmallGroup.addRow([
                        item.title,
                        item.publish,
                        item.status,
                        item.description,
                        item.conclusion,
                        item.introduction,
                        item.coverImage,
                        item.iceBreaker,
                        item.createdAt,
                        item.updatedAt, // Add displayAt column
                    ]);
                } else if (dataType === 'Most popular') {
                    wsMostPopularBooks.addRow([
                        item.title,
                        item.description,
                        item.overview,
                        item.coverImageBackground,
                        item.publish,
                        item.coverImage,
                        item.status,
                        item.bookReadFile,
                        item.views,
                        item.videoFileSize,
                        item.bookFor,
                        item.createdAt,
                        item.updatedAt,
                    ]);
                } else if (dataType === 'Books') {
                    wsBooks.addRow([
                        item.title,
                        item.description,
                        item.overview,
                        item.coverImageBackground,
                        item.publish,
                        item.coverImage,
                        item.status,
                        item.bookReadFile,
                        item.views,
                        item.videoFileSize,
                        item.bookFor,
                        item.createdAt,
                        item.updatedAt,
                    ]);
                } else if (dataType === 'Transactions') {
                    wsTransactions.addRow([
                        item.userId,
                        item.paymentLink,
                        item.reason,
                        item.latestInvoice,
                        item.status,
                        item.paymentMethod,
                        item.tax,
                        item.total,
                        item.device,
                        item.planCreatedAt,
                        item.planExpiredAt,
                    ]);
                } else if (dataType === 'Users') {
                    wsUsers.addRow([
                        item.firstName,
                        item.lastName,
                        item.email,
                        item.status,
                        item.image,
                        item.type,
                        item.isSignedUp,
                        item.device,
                        item.country,
                        item.timeZone,
                        item.createdAt,
                    ]);
                }
            });
        });

        const dailyDevotionalExcelHeaderCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1'];
        const curatedExcelHeaderCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1'];
        const smallGroupExcelHeaderCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'];
        const mostPopularExcelHeaderCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1', 'M1'];
        const booksExcelHeaderCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1', 'M1'];
        const transactionsExcelHeaderCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1'];
        const usersExcelHeaderCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1'];

        await setHeaderBackgroundColor(dailyDevotionalExcelHeaderCells, wsForDailyDevotional);
        await setHeaderBackgroundColor(curatedExcelHeaderCells, wsCuratedList);
        await setHeaderBackgroundColor(smallGroupExcelHeaderCells, wsSmallGroup);
        await setHeaderBackgroundColor(mostPopularExcelHeaderCells, wsMostPopularBooks);
        await setHeaderBackgroundColor(booksExcelHeaderCells, wsBooks);
        await setHeaderBackgroundColor(transactionsExcelHeaderCells, wsTransactions);
        await setHeaderBackgroundColor(usersExcelHeaderCells, wsUsers);

        await setColumnWidth(wsForDailyDevotional);
        await setColumnWidth(wsCuratedList);
        await setColumnWidth(wsSmallGroup);
        await setColumnWidth(wsMostPopularBooks);
        await setColumnWidth(wsBooks);
        await setColumnWidth(wsTransactions);
        await setColumnWidth(wsUsers);

        await workbook.xlsx.writeFile(fileName);
        const xlsxFileStream = fs.readFileSync(fileName);
        fs.unlinkSync(fileName);
        response.send(xlsxFileStream)
        // return xlsxFileStream;
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

const exportUsersData = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const fileName = `export_data_${Date.now()}.xlsx`;
        const filePath = path.join(__dirname, fileName);
        const workbook = new excel.stream.xlsx.WorkbookWriter({ stream: fs.createWriteStream(filePath) });

        const wsUsers = workbook.addWorksheet('Users');
        wsUsers.columns = [
            { header: 'First Name', key: 'firstName' },
            { header: 'Last Name', key: 'lastName' },
            { header: 'Email', key: 'email' },
            { header: 'Signup date', key: 'createdAt' },
            { header: 'Subscription', key: 'subscription' },
            { header: 'Subscription Status', key: 'subscriptionStatus' },
            { header: 'Payment Mode', key: 'paymentmethod' },
            { header: 'Total', key: 'total' },
            { header: 'Coupon', key: 'coupon' },
            { header: 'Device', key: 'device' },
            { header: 'Status', key: 'status' },
            { header: 'Country', key: 'country' },
            { header: 'Time Zone', key: 'timeZone' },
            { header: 'App Uninstalled Status', key: 'isAppUninstalled' },
        ];

        const params: any = request.body;
        let searchFilter: any = {};

        // Handle plan filter query
        const planQuery = [
            'Yearly',
            'Monthly',
            'Half Year',
        ].includes(
            params.planFilter
        )
            ? { 'subscription.title': params.planFilter }
            : {};

        const countryQuery = params.countryFilter
            ? { 'country': params.countryFilter }
            : {};

        const timeZoneQuery = params.timeZoneFilter
            ? { 'timeZone': params.timeZoneFilter }
            : {};

        // Handle payment mode filter query
        let paymentModeQuery: any = {};
        if (params.paymentModeFilter) {
            switch (params.paymentModeFilter) {
                case 'ios':
                    paymentModeQuery = {
                        'inAppSubscription.purchaseToken': { $exists: false },
                        'transaction.device': 'app',
                    };
                    break;
                case 'android':
                    paymentModeQuery = {
                        'inAppSubscription.purchaseToken': { $exists: true },
                        'transaction.device': 'app',
                    };
                    break;
                case 'web':
                    paymentModeQuery = {
                        'transaction.device': 'web',
                    };
                    break;
                default:
                    break;
            }
        }

        // Combine all filters based on statusFilter
        if (!params?.statusFilter) {
            searchFilter = {
                ...planQuery,
                ...countryQuery,
                ...timeZoneQuery,
                ...paymentModeQuery,
            };
        } else {
            const statusFilterLower = params.statusFilter.toLowerCase();
            if (statusFilterLower.includes('freemium')) {
                searchFilter.$or = [
                    ...(searchFilter.$or || []),
                    {
                        'stripe.status': {
                            $in: [
                                'trialing',
                                'incomplete',
                                'past_due',
                                'unpaid',
                                'incomplete_expired',
                            ],
                        },
                    },
                    {
                        stripe: { $exists: false },
                        inAppSubscription: { $exists: false },
                        ...planQuery,
                        ...countryQuery,
                        ...timeZoneQuery,
                        ...paymentModeQuery,
                    },
                ];
            }
            if (statusFilterLower.includes('cancelledplan')) {
                searchFilter.$or = [
                    ...(searchFilter.$or || []),
                    {
                        'stripe.status': 'canceled',
                        ...planQuery,
                        ...countryQuery,
                        ...timeZoneQuery,
                        ...paymentModeQuery,
                    },
                    {
                        'inAppSubscriptionStatus': 'Canceled',
                        ...planQuery,
                        ...countryQuery,
                        ...timeZoneQuery,
                        ...paymentModeQuery,
                    },
                ];
            }
            if (statusFilterLower.includes('presignupusers')) {
                searchFilter.$or = [
                    ...(searchFilter.$or || []),
                    {
                        'isSignedUp': false,
                        ...planQuery,
                        ...countryQuery,
                        ...timeZoneQuery,
                        ...paymentModeQuery,
                    },
                ];
            }
            if (statusFilterLower.includes('paiduser')) {
                searchFilter.$or = [
                    ...(searchFilter.$or || []),
                    {
                        'inAppSubscription': { $exists: true },
                        'inAppSubscriptionStatus': 'Active',
                        device: { $in: ['ios', 'android'] },
                        'stripe.coupon': { $eq: undefined },
                        ...planQuery,
                        ...countryQuery,
                        ...timeZoneQuery,
                        ...paymentModeQuery,
                    },
                    {
                        'stripe.status': 'active',
                        'stripe.coupon': { $eq: undefined },
                        ...planQuery,
                        ...countryQuery,
                        ...timeZoneQuery,
                        ...paymentModeQuery,
                    },
                ];
            }
            if (statusFilterLower.includes('couponactivated')) {
                searchFilter.$or = [
                    ...(searchFilter.$or || []),
                    {
                        'inAppSubscription': { $exists: true },
                        'inAppSubscriptionStatus': 'Active',
                        device: { $in: ['ios', 'android'] },
                        'stripe.status': 'active',
                        'stripe.coupon': { $exists: true, $ne: undefined },
                        ...planQuery,
                        ...countryQuery,
                        ...timeZoneQuery,
                        ...paymentModeQuery,
                    },
                    {
                        'stripe.status': 'active',
                        'stripe.coupon': { $exists: true, $ne: undefined },
                        ...planQuery,
                        ...countryQuery,
                        ...timeZoneQuery,
                        ...paymentModeQuery,
                    },
                ];
            }
            if (statusFilterLower.includes('registeredusers')) {
                searchFilter.$or = [
                    ...(searchFilter.$or || []),
                    {
                        'stripe.status': {
                            $in: [
                                'trialing',
                                'incomplete',
                                'past_due',
                                'unpaid',
                                'incomplete_expired',
                            ],
                        },
                        isSignedUp: true,
                    },
                    {
                        stripe: { $exists: false },
                        inAppSubscription: { $exists: false },
                        isSignedUp: true,
                        ...planQuery,
                        ...countryQuery,
                        ...timeZoneQuery,
                        ...paymentModeQuery,
                    },
                ];
            }
            if (statusFilterLower.includes('appuninstalledusers')) {
                searchFilter.$or = [
                    ...(searchFilter.$or || []),
                    {
                        'isAppUninstalled': true,
                        ...planQuery,
                        ...countryQuery,
                        ...timeZoneQuery,
                        ...paymentModeQuery,
                    },
                ];
            }
        }

        // Handle date range filter
        if (params.from && params.to) {
            const fromDate = new Date(params.from);
            const toDate = new Date(params.to);
            if (fromDate <= toDate) {
                searchFilter.createdAt = {
                    $gte: fromDate,
                    $lte: new Date(toDate.setDate(toDate.getDate() + 1)),
                };
            } else {
                return next(Boom.badData(authControllerResponse.invalidDateError));
            }
        } else if (params.from) {
            searchFilter.createdAt = {
                $gte: new Date(params.from),
            };
        } else if (params.to) {
            searchFilter.createdAt = {
                $lte: new Date(new Date(params.to).setDate(new Date(params.to).getDate() + 1)),
            };
        }

        searchFilter.type = 'User';

        const userData: any = await usersService.getAllExportUsers(searchFilter);

        userData.forEach(item => {
            wsUsers.addRow({
                firstName: item.firstName,
                lastName: item.lastName,
                email: item.email,
                createdAt: item.createdAt,
                subscription: item.subscription,
                subscriptionStatus: item.subscriptionStatus,
                paymentmethod: item.paymentmethod,
                total: item.total,
                coupon: item.coupon,
                device: item.device,
                status: item.status,
                country: item.country,
                timeZone: item.timeZone,
                isAppUninstalled : item.isAppUninstalled,
            })
        });
        const usersExcelHeaderCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1', 'M1', 'N1'];
        await setHeaderBackgroundColor(usersExcelHeaderCells, wsUsers);
        await setColumnWidth(wsUsers);
        await workbook.commit();
        response.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        fs.createReadStream(filePath).pipe(response).on('finish', () => fs.unlinkSync(filePath));
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};

export {
    exportData,
    exportUsersData
}
